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
        data.forEach((item) => {
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = `<strong>${item.name}</strong><br>
                ${item.address}<br>
                Price: $${item.price.toFixed(2)}`;
            resultsDiv.appendChild(itemDiv);
        });
    }
}

