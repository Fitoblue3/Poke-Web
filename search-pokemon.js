let allPokemonList = [];

const selectedPokemons = {
    firstSearch: null,
    secSearch: null
};

const gameState = {
    firstSearch: {currentHp: 0, maxHp: 0, alive: true},
    secSearch: {currentHp: 0, maxHp: 0, alive: true}
};

async function loadPokemonList() {
    try {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1500&offset=0");
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
};

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
};

async function showPreview(containerId, pokemonName) {
    const container = document.getElementById(containerId);
    const previewBox = container.querySelector('.preview-box');
    const spriteImg = container.querySelector('.preview-sprite');
    const nameHeading = container.querySelector('.preview-name');
    const typesContainer = container.querySelector('.types-container');

    const pokemonData = await getPokemonDetails(pokemonName);

    if (pokemonData) {
        selectedPokemons[containerId] = pokemonData;

        spriteImg.src = pokemonData.sprites.front_default || '';
        nameHeading.textContent = pokemonData.name.toUpperCase();

        typesContainer.innerHTML = '';
        pokemonData.types.forEach(typeInfo => {
            const span = document.createElement('span');
            span.classList.add('type-badge');
            span.textContent = typeInfo.type.name;
            typesContainer.appendChild(span);
        });

        previewBox.classList.remove('hidden');

        checkBattleReady();
    }
}

const checkBattleReady = () => {
    const startBtn = document.getElementById('startBattleBtn');
    if (selectedPokemons.firstSearch && selectedPokemons.secSearch) {
        startBtn.disabled = false;
    }
};

const startBattle = () => {
    document.querySelector('#startBattleBtn').parentElement.classList.add('hidden');

    ['firstSearch', 'secSearch'].forEach(id => {
        const container = document.getElementById(id);
        const data = selectedPokemons[id];
    
        container.querySelector('.input-wrapper').classList.add('hidden');
        const hpStat = data.stats.find(s => s.stat.name === 'hp').base_stat;

        gameState[id] = {
            currentHp: hpStat,
            maxHp: hpStat,
            alive: true
        };

        const battleBox = container.querySelector('.battle-box');
        battleBox.classList.remove('hidden');
        battleBox.querySelector('.hp-text').textContent = `${hpStat}/${hpStat}`;

        const movesGrid = battleBox.querySelector('.moves-grid');
        movesGrid.innerHTML = '';

        const opponentId = id === 'firstSearch' ? 'secSearch' : 'firstSearch';
        const moves = data.moves.slice(0, 4);

        moves.forEach(m => {
            const btn = document.createElement('button');
            btn.textContent = m.move.name;

            btn.addEventListener('click', () => attack(id, opponentId));
            movesGrid.appendChild(btn);
        });
    });
};

const attack = (attackerId, defenderId) => {
    if (!gameState[attackerId].alive || !gameState[defenderId].alive) return;

    const damage = Math.floor(Math.random() * 16) + 10;
    const defenderState = gameState[defenderId];

    defenderState.currentHp = Math.max(0, defenderState.currentHp - damage);

    const defenderContainer = document.getElementById(defenderId);
    const hpText = defenderContainer.querySelector('.hp-text');
    const hpBar = defenderContainer.querySelector('.hp-bar-fill');

    hpText.textContent = `${defenderState.currentHp}/${defenderState.maxHp}`;

    const hpPercent = (defenderState.currentHp / defenderState.maxHp) * 100;
    hpBar.style.width = `${hpPercent}%`;

    if (hpPercent < 25) {
        hpBar.style.backgroundColor = '#f44336';
    } else if (hpPercent < 50) {
        hpBar.style.backgroundColor = '#ff9800';
    }

    if (defenderState.currentHp === 0) {
        defenderState.alive = false;
        endBattle(selectedPokemons[attackerId].name);
    }
};

const endBattle = (winnerName) => {
    document.querySelectorAll('.moves-grid button').forEach(b => b.disabled = true);

    const banner = document.getElementById('winnerBanner');
    const winnerText = document.getElementById('winnerText');
    winnerText.textContent = `¡${winnerName.toUpperCase()} HA GANADO LA BATALLA! 🏆`;
    banner.classList.remove('hidden');
};

function resetGame() {
    selectedPokemons.firstSearch = null;
    selectedPokemons.secSearch = null;

    document.getElementById('winnerBanner').classList.add('hidden');

    const startBtn = document.getElementById('startBattleBtn');
    startBtn.disabled = true;
    startBtn.parentElement.classList.remove('hidden');

    ['firstSearch', 'secSearch'].forEach(id => {
        const container = document.getElementById(id);

        container.querySelector('.input-wrapper').classList.remove('hidden');
        container.querySelector('.search-input').value = '';

        container.querySelector('.types-container').innerHTML = '';

        container.querySelector('.preview-box').classList.add('hidden');
        container.querySelector('.battle-box').classList.add('hidden');

        const hpBar = container.querySelector('.hp-bar-fill');
        hpBar.style.width = '100%';
        hpBar.style.backgroundColor = '#4caf50';
    });
}

const setupListeners = () => {
    ['firstSearch', 'secSearch'].forEach(id => {
        const container = document.getElementById(id);
        const input = container.querySelector('.search-input');

        const handleSearch = debounce((e) => {
            renderSuggestions(id, e.target.value);
        }, 300);

        input.addEventListener('input', handleSearch);
    });

    document.getElementById('startBattleBtn').addEventListener('click', startBattle);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
};

async function init() {
    await loadPokemonList();
    setupListeners();
}

init();