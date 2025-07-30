document.addEventListener("DOMContentLoaded", function() {
  const authorLinks = document.querySelectorAll(".author-link");
  
  // Initialize the Bootstrap Modal
  const authorModalElement = document.getElementById('authorModal');
  if (authorModalElement) {
    const authorModal = new bootstrap.Modal(authorModalElement);
    
    authorLinks.forEach(link => {
      link.addEventListener("click", function(event) {
        event.preventDefault(); // Prevent page from jumping to top
        getAuthorInfo(this.id, authorModal);
      });
    });
  }
});

async function getAuthorInfo(authorId, modalInstance) {
  try {
    // Show a loading state in the modal
    const authorInfoDiv = document.getElementById("authorInfo");
    authorInfoDiv.innerHTML = `<div class="d-flex justify-content-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
    modalInstance.show();

    // Fetch author data from our API
    let response = await fetch(`/api/author/${authorId}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.json();

    // Format DOB and DOD for display
    const dob = new Date(data.dob).toLocaleDateString();
    const dod = new Date(data.dod).toLocaleDateString();

    // Populate the modal with the fetched data
    authorInfoDiv.innerHTML = `
      <div class="row">
        <div class="col-md-4">
          <img src="${data.pictureUrl}" class="img-fluid rounded" alt="${data.firstName} ${data.lastName}">
        </div>
        <div class="col-md-8">
          <h3>${data.firstName} ${data.lastName}</h3>
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
    document.getElementById("authorInfo").innerHTML = "<p class='text-danger'>Sorry, could not load author information.</p>";
  }
}