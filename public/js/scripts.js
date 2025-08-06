document.addEventListener("DOMContentLoaded", () => {
  // Author‐info modal links
  const authorLinks = document.querySelectorAll(".author-link");
  const authorModalEl = document.getElementById("authorModal");
  if (authorModalEl) {
    const authorModal = new bootstrap.Modal(authorModalEl);
    authorLinks.forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        getAuthorInfo(link.id, authorModal);
      });
    });
  }

  // Bootstrap form‐validation (if you have forms here)
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', ev => {
      if (!form.checkValidity()) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });
});

async function getAuthorInfo(authorId, modalInstance) {
  const infoDiv = document.getElementById("authorInfo");
  infoDiv.innerHTML = `<div class="text-center my-4"><div class="spinner-border"></div></div>`;
  modalInstance.show();
  try {
    const res = await fetch(`/api/author/${authorId}`);
    const data = await res.json();
    const dob = new Date(data.dob).toLocaleDateString();
    const dod = data.dod ? new Date(data.dod).toLocaleDateString() : 'N/A';
    infoDiv.innerHTML = `
      <div class="row">
        <div class="col-md-4 text-center">
          <img src="${data.portrait}" class="img-fluid rounded mb-3" alt="${data.firstName} ${data.lastName}">
        </div>
        <div class="col-md-8">
          <h4>${data.firstName} ${data.lastName}</h4>
          <p><strong>Born:</strong> ${dob}</p>
          <p><strong>Died:</strong> ${dod}</p>
          <p>${data.biography}</p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    infoDiv.innerHTML = `<div class="alert alert-danger">Could not load author info.</div>`;
  }
}

async function editQuote(quoteId) {
  try {
    const res = await fetch(`/api/quotes/${quoteId}/edit`);
    const html = await res.text();
    document.querySelector("#editQuoteModal .modal-body").innerHTML = html;
    new bootstrap.Modal(document.getElementById("editQuoteModal")).show();
  } catch (err) {
    console.error(err);
    alert("Error loading edit form.");
  }
}

async function deleteQuote(quoteId) {
  if (!confirm("Delete this quote?")) return;
  try {
    const res = await fetch(`/api/quotes/${quoteId}`, { method: 'DELETE' });
    if (res.ok) window.location.reload();
    else throw new Error(await res.text());
  } catch (err) {
    console.error(err);
    alert("Failed to delete quote.");
  }
}

async function deleteAuthor(authorId) {
  if (!confirm("Delete this author and all of their quotes?")) return;
  try {
    const res = await fetch(`/api/authors/${authorId}`, { method: 'DELETE' });
    if (res.ok) window.location.href = '/';
    else {
      const { message } = await res.json();
      alert("Failed to delete author: " + message);
    }
  } catch (err) {
    console.error(err);
    alert("Error deleting author.");
  }
}
