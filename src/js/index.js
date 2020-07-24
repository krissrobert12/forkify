import Search from './models/Search';
import Recipe from './models/Recipe';

import * as searchView from './views/searchView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the app
 * - Search object
 * - Current object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};


/**
 * Search Controller
 */
const controlSearch = async () => {

    // 1. get query from view
    const query = searchView.getInput();

    if (query) {
        // 2. new search object and add to state
        state.search = new Search(query);

        // 3. prepare ui for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {

            // 4. search for recipes
            await state.search.getResults();

            // 5. render results on ui
            clearLoader();
            searchView.renderResults(state.search.result);

        } catch(error) {
            console.log(error);
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});


elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    let goToPage;

    if (btn) {
        goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});



/**
 * Recipe Controller
 */

 const controlRecipe = async () => {

    // Get id from url
    const id = window.location.hash.replace('#', '');

    if (id) {
        
        // Prepare UI for changes

        // Create new recipe object
        state.recipe = new Recipe(id);

        try {

            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // Render recipe
            console.log(state.recipe);

        } catch(error) {
            console.log(error);
        }
    }
 };

['hashchange', 'load'].forEach(element => window.addEventListener(element, controlRecipe));

