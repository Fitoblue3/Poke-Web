let allPokemonList = [];

const selectedPokemons = {
    firstSearch: null,
    secSearch: null
};

async function loadPokemonList () {
    try {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0")

        const data = await response.json();
        allPokemonList = data.results;
    } catch (error) {
        console.error('Error al cargar la lista inicial:', error);
    }
}

async function getPokemonDetails(nameOrId) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${nameOrId.toLowerCase()}`);
        if (!response.ok) throw new Error('Pokemon no encontrado');
        return await response.json();
    } catch (error) {
        return null;
    }
}

const debounce = (func, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

const renderSuggestions = (containerId, query) => {
    const container = document.getElementById(containerId);
    const suggestionsUl = container.querySelector('.suggestions');
    suggestionsUl.innerHTML = '';

    if (!query.trim()) return;

    const matches = allPokemonList
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
    matches.forEach(pokemon => {
        const li = document.createElement('li');
        li.textContent = pokemon.name;

        li.addEventListener('click', async () => {
            suggestionsUl.innerHTML = '';
            container.querySelector('.search-input').value = pokemon.name;
            await showPreview(containerId, pokemon.name);
        });

        suggestionsUl.appendChild(li);
    });
}

async function showPreview(containerId, pokemonName) {
    const container = document.getElementById(containerId);
    const previewBox = container.querySelector('.preview-box');
    const spriteImg = container.querySelector('.preview-sprite');
    const nameHeading = container.querySelector('.preview-name');

    const pokemonData = await getPokemonDetails(pokemonName);

    if (pokemonData) {
        selectedPokemons[containerId] = pokemonData;

        spriteImg.src = pokemonData.sprites.front_default || '';
        nameHeading.textContent = pokemonData.name.toUpperCase();

        previewBox.classList.remove('hidden');
    }
}

const setupListeners = () => {
    ['firstSearch', 'secSearch'].forEach(id => {
        const container = document.getElementById(id)
        const input = container.querySelector('.search-input')
        
        const handleSearch = debounce((e) => {
            renderSuggestions(id, e.target.value);
        }, 300);

        input.addEventListener('input', handleSearch);
    });
}

async function init() {
    await loadPokemonList();
    setupListeners();
}

init();