document
    .getElementById('search-form')
    .addEventListener('submit', function (event) {
        event.preventDefault();
        const zipcode = document.getElementById('zipcode').value;
        const produceItem = document.getElementById('produce-item').value;

        fetch(`/search?zipcode=${zipcode}&produce=${produceItem}`)
            .then((response) => response.json())
            .then((data) => displayResults(data))
            .catch((error) => console.error('Error fetching data:', error));
    });

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (data.length === 0) {
        resultsDiv.textContent = 'No results found.';
    } else {
        data.forEach((store) => {
            const storeInfo = document.createElement('div');
            storeInfo.innerHTML = `<strong>${store.name}</strong><br>
            ${store.address}<br>
            Price: $${store.price.toFixed(2)}`;
            resultsDiv.appendChild(storeInfo);
        });
    }
}

