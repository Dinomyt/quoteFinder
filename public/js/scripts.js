document.addEventListener("DOMContentLoaded", () => {
  // Wire up author info links
  const authorLinks = document.querySelectorAll(".author-link");
  const authorModalEl = document.getElementById("authorModal");
  if (authorModalEl && authorLinks.length) {
    const authorModal = new bootstrap.Modal(authorModalEl);
    authorLinks.forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        getAuthorInfo(link.id, authorModal);
      });
    });
  }
});

async function getAuthorInfo(authorId, modalInstance) {
  const authorInfoDiv = document.getElementById("authorInfo");
  authorInfoDiv.innerHTML = `
    <div class="d-flex justify-content-center my-4">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;
  modalInstance.show();

  try {
    const res = await fetch(`/api/author/${authorId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const dob = new Date(data.dob).toLocaleDateString();
    const dod = data.dod ? new Date(data.dod).toLocaleDateString() : "N/A";

    authorInfoDiv.innerHTML = `
      <div class="row">
        <div class="col-md-4 text-center">
          <img src="${data.portrait || data.pictureUrl}" class="img-fluid rounded mb-3" alt="${data.firstName} ${data.lastName}">
        </div>
        <div class="col-md-8">
          <h4>${data.firstName} ${data.lastName}</h4>
          <p><strong>Profession:</strong> ${data.profession}</p>
          <p><strong>Country:</strong> ${data.country}</p>
          <p><strong>Born:</strong> ${dob}</p>
          <p><strong>Died:</strong> ${dod}</p>
          <hr>
          <p>${data.biography || data.bio}</p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Failed to fetch author info:", err);
    authorInfoDiv.innerHTML = `<div class="alert alert-danger">Could not load author information.</div>`;
  }
}

async function editQuote(quoteId) {
  try {
    const res = await fetch(`/api/quotes/${quoteId}/edit`);
    if (!res.ok) {
      console.error(await res.text());
      alert("Could not load edit form.");
      return;
    }
    const html = await res.text();
    document.querySelector("#editQuoteModal .modal-body").innerHTML = html;
    new bootstrap.Modal(document.getElementById("editQuoteModal")).show();
  } catch (err) {
    console.error("Error loading edit form:", err);
    alert("Error opening edit modal.");
  }
}

async function deleteQuote(quoteId) {
  if (!confirm("Are you sure you want to delete this quote?")) return;
  try {
    const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
    if (res.ok) {
      window.location.reload();
    } else {
      console.error(await res.text());
      alert("Failed to delete quote.");
    }
  } catch (err) {
    console.error("Error deleting quote:", err);
    alert("Error deleting quote.");
  }
}
