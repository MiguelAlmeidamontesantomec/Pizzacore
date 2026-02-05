/* --- SISTEMA DE RECEITAS E FICHA TÉCNICA (receita.js v2 - Com Preço) --- */

const RECIPES_KEY = 'pizzacore.recipes.v1';
const STOCK_KEY_PROD = 'pizzacore.stock.products.v1';
const STOCK_KEY_HIST = 'pizzacore.stock.history.v1';

let tempIngredients = []; 

// --- FUNÇÕES DE LEITURA ---
function getRecipes() { return JSON.parse(localStorage.getItem(RECIPES_KEY)) || []; }
function getStockProd() { return JSON.parse(localStorage.getItem(STOCK_KEY_PROD)) || []; }
function getStockHist() { return JSON.parse(localStorage.getItem(STOCK_KEY_HIST)) || []; }

function saveRecipes(data) { localStorage.setItem(RECIPES_KEY, JSON.stringify(data)); }
function saveStockHist(data) { localStorage.setItem(STOCK_KEY_HIST, JSON.stringify(data)); }

// --- TELA DE RECEITAS ---

function initRecipesView() {
    populateIngredientSelect();
    renderSavedRecipes();
    tempIngredients = [];
    renderTempIngredients();
}

function populateIngredientSelect() {
    const select = document.getElementById('recipeIngredientSelect');
    if(!select) return;
    const products = getStockProd();
    select.innerHTML = '<option value="">Selecione do estoque...</option>';
    products.sort((a,b) => a.name.localeCompare(b.name)).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.setAttribute('data-unit', p.unit || 'un');
        opt.innerText = `${p.name} (${p.unit || 'un'})`;
        select.appendChild(opt);
    });
}

function addIngredientToRecipe() {
    const select = document.getElementById('recipeIngredientSelect');
    const name = select.value;
    const unit = select.options[select.selectedIndex]?.getAttribute('data-unit') || 'un';
    const qty = parseFloat(document.getElementById('recipeIngredientQty').value);

    if(!name || !qty || qty <= 0) return alert('Selecione um ingrediente e quantidade válida.');

    tempIngredients.push({ name, qty, unit });
    renderTempIngredients();
    
    select.value = "";
    document.getElementById('recipeIngredientQty').value = "";
}

function removeTempIngredient(index) {
    tempIngredients.splice(index, 1);
    renderTempIngredients();
}

function renderTempIngredients() {
    const container = document.getElementById('tempIngredientList');
    if(!container) return;
    if(tempIngredients.length === 0) {
        container.innerHTML = '<span style="color: #999; font-size: 12px; align-self: center;">Nenhum ingrediente adicionado.</span>';
        return;
    }
    container.innerHTML = '';
    tempIngredients.forEach((item, idx) => {
        const tag = document.createElement('div');
        tag.style.cssText = "background: #fff; padding: 5px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; display: flex; align-items: center; gap: 8px;";
        tag.innerHTML = `<b>${item.name}</b>: ${item.qty}${item.unit} <i class="fa-solid fa-trash" style="cursor: pointer; color: red; margin-left: 5px;" onclick="removeTempIngredient(${idx})"></i>`;
        container.appendChild(tag);
    });
}

// SALVAR RECEITA (Com Preço)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recipeForm');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('recipeName').value.trim();
            const price = parseFloat(document.getElementById('recipePrice').value); // NOVO CAMPO
            
            if(!name) return alert('Dê um nome para a receita.');
            if(!price || price < 0) return alert('Defina um preço de venda válido.');
            if(tempIngredients.length === 0) return alert('Adicione pelo menos um ingrediente.');

            const recipes = getRecipes();
            // Salva preço junto
            const newRecipe = { id: Date.now().toString(), name, price: price, ingredients: tempIngredients };
            
            recipes.push(newRecipe);
            saveRecipes(recipes);
            
            alert('Receita Salva!');
            document.getElementById('recipeName').value = '';
            document.getElementById('recipePrice').value = ''; // Limpa preço
            tempIngredients = [];
            renderTempIngredients();
            renderSavedRecipes();
        });
    }
});

function renderSavedRecipes() {
    const list = document.getElementById('savedRecipesList');
    if(!list) return;
    const recipes = getRecipes();
    list.innerHTML = '';
    
    if(recipes.length === 0) return list.innerHTML = '<div class="clients-empty">Nenhuma receita criada.</div>';

    recipes.forEach(r => {
        const row = document.createElement('div');
        row.className = 'client-row';
        const ingText = r.ingredients.map(i => `${i.qty}${i.unit} ${i.name}`).join(', ');
        
        // Exibe o preço formatado
        const priceDisplay = r.price ? `R$ ${parseFloat(r.price).toFixed(2)}` : 'R$ 0.00';

        row.innerHTML = `
            <div class="client-info">
                <div class="client-name">
                    <i class="fa-solid fa-utensils" style="color:#666; margin-right:8px;"></i> 
                    ${r.name} 
                    <span style="color: #0A7D2C; font-weight: bold; margin-left: 10px;">${priceDisplay}</span>
                </div>
                <div class="client-phone" style="font-size: 11px; color:#666;">${ingText}</div>
            </div>
            <div class="client-actions">
                <button type="button" class="clients-btn clients-btn-small clients-btn-danger" onclick="deleteRecipe('${r.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(row);
    });
}

function deleteRecipe(id) {
    if(!confirm('Excluir esta receita?')) return;
    const recipes = getRecipes().filter(r => r.id !== id);
    saveRecipes(recipes);
    renderSavedRecipes();
}

// --- INTEGRAÇÃO COM PEDIDOS ---

function populateOrderRecipeSelect() {
    const select = document.getElementById('orderProduct');
    if(!select) return;
    const recipes = getRecipes();
    select.innerHTML = '<option value="">Selecione o produto...</option>';
    recipes.sort((a,b) => a.name.localeCompare(b.name)).forEach(r => {
        const price = r.price ? ` - R$ ${parseFloat(r.price).toFixed(2)}` : '';
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name + price; // Mostra o preço no select do pedido
        select.appendChild(opt);
    });
}

// Agora retorna um OBJETO com { nome, preçoTotal } para o pedido salvar
function processOrderStockDeduction(recipeId, quantity) {
    const recipes = getRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    
    if(!recipe) return null;

    const history = getStockHist();
    const now = new Date().toISOString();
    
    recipe.ingredients.forEach(ing => {
        const totalDeduct = ing.qty * quantity;
        history.push({
            id: Date.now().toString() + Math.random(),
            productName: ing.name,
            quantity: -totalDeduct,
            unit: ing.unit,
            cost: 0,
            invoice: 'VENDA AUTOMÁTICA',
            expiry: 'N/A',
            date: now
        });
    });
    
    saveStockHist(history);

    // Retorna dados para o pedido (Nome e Valor Total da venda deste item)
    const unitPrice = recipe.price || 0;
    return { 
        name: recipe.name, 
        totalValue: unitPrice * quantity 
    };
}

// Função para DEVOLVER itens ao estoque (Cancelamento)
function returnOrderStock(recipeId, quantity) {
    const recipes = getRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) return false;

    const history = getStockHist();
    const now = new Date().toISOString();
    
    recipe.ingredients.forEach(ing => {
        const totalReturn = ing.qty * quantity;
        
        history.push({
            id: Date.now().toString() + Math.random(),
            productName: ing.name,
            quantity: totalReturn, // POSITIVO (Devolução)
            unit: ing.unit,
            cost: 0,
            invoice: 'ESTORNO / CANCELAMENTO', // Marcação clara
            expiry: 'N/A',
            date: now
        });
    });
    
    saveStockHist(history);
    return true;
}