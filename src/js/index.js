import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
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
 * List Controller
 */
const controlList = () => {
    // Create a new list if there is none yet
    if(!state.list) state.list = new List();

    // Add each ingredint to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

//Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {

        // delete from state
        state.list.deleteItem(id);

        // delete from ui
        listView.deleteItem(id);
    
    // handle count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value);
        state.list.updateCount(id, val);
    }

    
});



/**
 * Like Controller
 */
const controlLikes = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has not likest current recipe yet
    if(!state.likes.isLiked(currentID)) {
        // Add like to state
        const newLike = state.likes.addLike(
            currentID, 
            state.recipe.title, 
            state.recipe.author,
            state.recipe.image,
        );
        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to ui list
        likesView.renderLike(newLike);

    } else {
        // Remove like to state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like to ui list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};



// Restore likes recipes on the page
window.addEventListener('load', () => {
    state.likes = new Likes();

    // Restore likes
    state.likes.readStorage();

    // Toggle likes button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});


/**
 * Recipe Controller
 */

 const controlRecipe = async () => {

    // Get id from url
    const id = window.location.hash.replace('#', '');

    if (id) {
        
        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected search item
        if (state.search) searchView.highlightSelected(id);

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
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        } catch(error) {
            console.log(error);
        }
    }
 };

['hashchange', 'load'].forEach(element => window.addEventListener(element, controlRecipe));

// Handling recipe btn clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {

        // Decrease 
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }

    } else if (e.target.matches('.btn-increase, .btn-increase *')) {

        // Increase
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);

    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {

        controlList();

    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLikes();
    }
});