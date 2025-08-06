// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
  // AUTHOR INFO LINKS
  const authorLinks = document.querySelectorAll(".author-link");
  const authorModalEl = document.getElementById("authorModal");
  if (authorModalEl && authorLinks.length) {
    const authorModal = new bootstrap.Modal(authorModalEl);
    authorLinks.forEach(link => {
      link.addEventListener("click", event => {
        event.preventDefault();
        // Assuming you use `id="<%= q.authorId %>"` on the link
        getAuthorInfo(link.id, authorModal);
      });
    });
  }
});

// Fetch & display author details in the authorModal
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
          <img
            src="${data.portrait || data.pictureUrl}"
            alt="${data.firstName} ${data.lastName}"
            class="img-fluid rounded mb-3"
          >
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
    authorInfoDiv.innerHTML = `
      <div class="alert alert-danger">
        Could not load author information.
      </div>
    `;
  }
}

// Load the edit form partial into the editQuoteModal and show it
async function editQuote(quoteId) {
  try {
    const res = await fetch(`/api/quotes/${quoteId}/edit`);
    if (!res.ok) {
      const text = await res.text();
      console.error("Edit fetch failed:", text);
      alert("Could not load edit form.");
      return;
    }

    const html = await res.text();
    // Inject into the .modal-body, keeping the .modal-dialog wrapper intact
    document.querySelector("#editQuoteModal .modal-body").innerHTML = html;

    new bootstrap.Modal(document.getElementById("editQuoteModal")).show();
  } catch (err) {
    console.error("Error loading edit form:", err);
    alert("Error opening edit modal.");
  }
}

// Delete a quote by ID (with confirmation)
async function deleteQuote(quoteId) {
  if (!confirm("Are you sure you want to delete this quote?")) return;

  try {
    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: "DELETE"
    });
    if (res.ok) {
      // either reload or remove the card from DOM
      window.location.reload();
    } else {
      const text = await res.text();
      console.error("Delete failed:", text);
      alert("Failed to delete quote.");
    }
  } catch (err) {
    console.error("Error during delete:", err);
    alert("Error deleting quote.");
  }
}
