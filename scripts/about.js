// /scripts/about.js
document.addEventListener('DOMContentLoaded', () => {
    // Existing code for How It Works section
    const steps = document.querySelectorAll('.how-it-works-section .step');
    const imageContainer = document.querySelector('.how-it-works-section .image-container');

    steps.forEach(step => {
        step.addEventListener('click', () => {
            steps.forEach(s => s.classList.remove('active'));
            step.classList.add('active');
            const index = step.getAttribute('data-index');
            imageContainer.style.transform = `translateX(-${index * 100}%)`;
        });
    });

    // New code for animated counters in Stats Section
    const counters = document.querySelectorAll('.counter');
    
    const animateCounter = (counter) => {
        const target = +counter.getAttribute('data-target');
        const duration = 2000; // Animation duration in milliseconds
        const start = 0;
        const increment = target / (duration / 16); // 60 FPS
        
        let current = start;
        
        const updateCounter = () => {
            current += increment;
            if (current >= target) {
                counter.innerText = target.toLocaleString(); // Adds commas for thousands
            } else {
                counter.innerText = Math.ceil(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            }
        };
        
        // Start animation when element is in viewport
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                requestAnimationFrame(updateCounter);
                observer.disconnect();
            }
        }, { threshold: 0.5 });
        
        observer.observe(counter.parentElement);
    };
    
    counters.forEach(animateCounter);
});

document.addEventListener("DOMContentLoaded", function () {
    const steps = document.querySelectorAll(".how-it-works-section .step");
    const imageContainer = document.querySelector(".how-it-works-section .image-container");
    const images = document.querySelectorAll(".how-it-works-section .image-container img");

    const slideWidth = images[0].offsetWidth;

    steps.forEach((step, index) => {
        step.addEventListener("click", () => {
            // Remove active class from all steps
            steps.forEach(s => s.classList.remove("active"));
            step.classList.add("active");

            // Slide the image
            imageContainer.style.transform = `translateX(-${index * slideWidth}px)`;
        });
    });

    // Resize fix: Recalculate slide width on window resize
    window.addEventListener("resize", () => {
        const activeStep = document.querySelector(".how-it-works-section .step.active");
        const activeIndex = parseInt(activeStep.getAttribute("data-index"), 10);
        const newSlideWidth = images[0].offsetWidth;
        imageContainer.style.transform = `translateX(-${activeIndex * newSlideWidth}px)`;
    });
});
