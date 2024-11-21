let scrollPosition = 0;

// บันทึกตำแหน่งการเลื่อนก่อนเปิด Modal
$('#productModal').on('show.bs.modal', function () {
    scrollPosition = $(window).scrollTop();
    $('body').css('top', `-${scrollPosition}px`).addClass('modal-open-fix');
});

// คืนค่า Scrollbar หลังปิด Modal
$('#productModal').on('hidden.bs.modal', function () {
    $('body').removeClass('modal-open-fix').css('top', '');
    $(window).scrollTop(scrollPosition);
});

// จัดการการเปิด Modal
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

        $('#productModal').modal('show');
    });
});