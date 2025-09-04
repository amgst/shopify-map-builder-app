console.log('Hello from the Product Map Builder Extension!');

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('custom-map-builder-container');
  if (container) {
    const productId = container.dataset.productId;
    console.log('This map builder is for product ID:', productId);
    // In the next step, we will load our real map app here.
    container.innerHTML = '<h2>Map Builder App will load right here.</h2>';
  }
});