document.addEventListener("DOMContentLoaded", function() {
  const authorLinks = document.querySelectorAll(".author-link");
  
  const authorModalElement = document.getElementById('authorModal');
  if (authorModalElement) {
    const authorModal = new bootstrap.Modal(authorModalElement);
    
    authorLinks.forEach(link => {
      link.addEventListener("click", function(event) {
        event.preventDefault();
        getAuthorInfo(this.id, authorModal);
      });
    });
  }
});

async function getAuthorInfo(authorId, modalInstance) {
  try {
    const authorInfoDiv = document.getElementById("authorInfo");
    authorInfoDiv.innerHTML = `<div class="d-flex justify-content-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
    modalInstance.show();

    let response = await fetch(`/api/author/${authorId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    let data = await response.json();

    const dob = new Date(data.dob).toLocaleDateString();
    const dod = data.dod ? new Date(data.dod).toLocaleDateString() : 'N/A';

    authorInfoDiv.innerHTML = `
      <div class="row">
        <div class="col-md-4">
          <img src="${data.pictureurl}" class="img-fluid rounded" alt="${data.firstname} ${data.lastname}">
        </div>
        <div class="col-md-8">
          <h3>${data.firstname} ${data.lastname}</h3>
          <p><strong>Profession:</strong> ${data.profession}</p>
          <p><strong>Country:</strong> ${data.country}</p>
          <p><strong>Born:</strong> ${dob}</p>
          <p><strong>Died:</strong> ${dod}</p>
          <hr>
          <p><strong>Bio:</strong> ${data.bio}</p>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('Failed to fetch author info:', error);
    document.getElementById("authorInfo").innerHTML = "<p class='text-danger'>Could not load author information.</p>";
  }
}

async function editQuote(quoteId) {
    const modal = new bootstrap.Modal(document.getElementById('editQuoteModal'));
    const response = await fetch(`/api/quotes/${quoteId}/edit`);
    document.querySelector('#editQuoteModal .modal-content').innerHTML = await response.text();
    modal.show();
}

async function deleteQuote(quoteId) {
    if (confirm('Are you sure you want to delete this quote?')) {
        try {
            const response = await fetch(`/api/quotes/${quoteId}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                location.reload(); 
            } else {
                alert('Failed to delete quote.');
            }
        } catch (error) {
            console.error('Error deleting quote:', error);
        }
    }
}