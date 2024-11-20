// modal-handlers.js
const cardContents = document.querySelectorAll('.card-content');

cardContents.forEach(cardContent => {
    cardContent.addEventListener('click', () => {
        const name = cardContent.getAttribute('data-name');
        const imageSrc = cardContent.getAttribute('data-image');
        const price = cardContent.getAttribute('data-price');
        const description = cardContent.getAttribute('data-description');

        document.getElementById('productModalLabel').textContent = name;
        document.getElementById('modalImage').src = imageSrc;
        document.getElementById('modalProductName').textContent = name;
        document.getElementById('modalProductPrice').textContent = price;
        document.getElementById('modalProductDescription').textContent = description;

        $('#productModal').modal('show'); // Using jQuery to open the modal
    });
});
