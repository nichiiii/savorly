/* =====================================================
   SAVORLY
   Recipe Finder
   ===================================================== */


/* =========================
   API
   ========================= */

const API_BASE =
    "https://www.themealdb.com/api/json/v1/1";


/* =========================
   ELEMENTS
   ========================= */

const splashScreen =
    document.getElementById("splash-screen");

const homeScreen =
    document.getElementById("home-screen");

const detailsScreen =
    document.getElementById("details-screen");

const savedScreen =
    document.getElementById("saved-screen");

const searchForm =
    document.getElementById("search-form");

const searchInput =
    document.getElementById("search-input");

const recipeGrid =
    document.getElementById("recipe-grid");

const savedGrid =
    document.getElementById("saved-grid");

const resultsTitle =
    document.getElementById("results-title");

const recipeDetails =
    document.getElementById("recipe-details");

const loading =
    document.getElementById("loading");

const message =
    document.getElementById("message");

const backButton =
    document.getElementById("back-button");

const savedBackButton =
    document.getElementById("saved-back-button");

const savedButton =
    document.getElementById("saved-button");

const homeLogo =
    document.getElementById("home-logo");


/* =========================
   FAVORITES
   ========================= */

let savedRecipes =
    JSON.parse(
        localStorage.getItem("savorlyFavorites")
    ) || [];


/* =========================
   SPLASH SCREEN
   ========================= */

window.addEventListener("load", () => {

    setTimeout(() => {

        splashScreen.classList.add("hide");

    }, 1500);

});


/* =========================
   SEARCH
   ========================= */

searchForm.addEventListener(
    "submit",
    handleSearch
);


async function handleSearch(event) {

    event.preventDefault();

    const ingredient =
        searchInput.value.trim();

    if (!ingredient) {

        showMessage(
            "Please enter an ingredient to search."
        );

        return;
    }

    await searchRecipes(ingredient);
}


/* =========================
   SEARCH RECIPES
   ========================= */

async function searchRecipes(ingredient) {

    showLoading();

    hideMessage();

    try {

        /*
         * TheMealDB's free V1 API supports
         * filtering by one main ingredient.
         */

        const url =
            `${API_BASE}/filter.php?i=${encodeURIComponent(
                ingredient
            )}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "Unable to contact recipe service."
            );
        }

        const data =
            await response.json();

        const meals =
            data.meals || [];

        hideLoading();

        resultsTitle.textContent =
            `Recipes with ${ingredient}`;

        if (meals.length === 0) {

            recipeGrid.innerHTML = "";

            showMessage(
                `No recipes found for "${ingredient}". Try another ingredient.`
            );

            return;
        }

        /*
         * The free endpoint gives us the basic
         * information needed for cards.
         */

        renderRecipeCards(meals);

    } catch (error) {

        hideLoading();

        console.error(error);

        showMessage(
            "Something went wrong while finding recipes. Please try again."
        );
    }
}


/* =========================
   RENDER RECIPE CARDS
   ========================= */

function renderRecipeCards(meals) {

    hideMessage();

    recipeGrid.innerHTML = "";

    meals.forEach(meal => {

        const card =
            createRecipeCard(meal);

        recipeGrid.appendChild(card);

    });
}


/* =========================
   CREATE RECIPE CARD
   ========================= */

function createRecipeCard(meal) {

    const article =
        document.createElement("article");

    article.className =
        "recipe-card";

    const isSaved =
        savedRecipes.some(
            recipe => recipe.idMeal === meal.idMeal
        );

    article.innerHTML = `

        <div class="recipe-image-wrapper">

            <img
                class="recipe-image"
                src="${meal.strMealThumb}"
                alt="${meal.strMeal}"
                loading="lazy"
            >

            <button
                class="card-favorite ${isSaved ? "saved" : ""}"
                type="button"
                aria-label="Save recipe"
            >
                ${isSaved ? "♥" : "♡"}
            </button>

        </div>

        <div class="recipe-info">

            <h3>
                ${meal.strMeal}
            </h3>

            <p class="recipe-category">
                Recipe
            </p>

            <button
                class="view-recipe"
                type="button"
            >
                View Recipe
            </button>

        </div>
    `;


    /* Favorite */

    const favoriteButton =
        article.querySelector(
            ".card-favorite"
        );

    favoriteButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleFavorite(meal);

            const currentlySaved =
                isRecipeSaved(meal.idMeal);

            favoriteButton.textContent =
                currentlySaved ? "♥" : "♡";

            favoriteButton.classList.toggle(
                "saved",
                currentlySaved
            );

        }
    );


    /* Open recipe */

    const viewButton =
        article.querySelector(
            ".view-recipe"
        );

    viewButton.addEventListener(
        "click",
        () => {

            openRecipe(meal.idMeal);

        }
    );


    return article;
}


/* =========================
   OPEN RECIPE
   ========================= */

async function openRecipe(id) {

    showLoading();

    try {

        const response =
            await fetch(
                `${API_BASE}/lookup.php?i=${id}`
            );

        if (!response.ok) {

            throw new Error(
                "Could not load recipe."
            );
        }

        const data =
            await response.json();

        const meal =
            data.meals?.[0];

        if (!meal) {

            throw new Error(
                "Recipe not found."
            );
        }

        renderRecipeDetails(meal);

        homeScreen.classList.add("hidden");

        savedScreen.classList.add("hidden");

        detailsScreen.classList.remove(
            "hidden"
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        hideLoading();

    } catch (error) {

        hideLoading();

        console.error(error);

        showMessage(
            "Unable to load this recipe."
        );
    }
}


/* =========================
   RECIPE DETAILS
   ========================= */

function renderRecipeDetails(meal) {

    const ingredients =
        getIngredients(meal);

    const isSaved =
        isRecipeSaved(meal.idMeal);


    recipeDetails.innerHTML = `

        <img
            class="details-image"
            src="${meal.strMealThumb}"
            alt="${meal.strMeal}"
        >

        <div class="details-content">

            <div class="details-header">

                <div>

                    <h1>
                        ${meal.strMeal}
                    </h1>

                    <p class="details-meta">
                        ${meal.strCategory || "Recipe"}
                        ${meal.strArea ? ` • ${meal.strArea}` : ""}
                    </p>

                </div>

                <button
                    id="details-favorite"
                    class="details-favorite"
                    type="button"
                    aria-label="Save recipe"
                >
                    ${isSaved ? "♥" : "♡"}
                </button>

            </div>


            <div class="details-columns">

                <section>

                    <h2>
                        Ingredients
                    </h2>

                    <ul class="ingredients-list">

                        ${ingredients.map(item => `

                            <li>
                                ${item.measure}
                                ${item.ingredient}
                            </li>

                        `).join("")}

                    </ul>

                </section>


                <section>

                    <h2>
                        Instructions
                    </h2>

                    <p class="instructions">
                        ${meal.strInstructions || "No instructions available."}
                    </p>

                </section>

            </div>

        </div>
    `;


    const favoriteButton =
        document.getElementById(
            "details-favorite"
        );


    favoriteButton.addEventListener(
        "click",
        () => {

            toggleFavorite(meal);

            const nowSaved =
                isRecipeSaved(meal.idMeal);

            favoriteButton.textContent =
                nowSaved ? "♥" : "♡";

        }
    );
}


/* =========================
   GET INGREDIENTS
   ========================= */

function getIngredients(meal) {

    const ingredients = [];

    for (let i = 1; i <= 20; i++) {

        const ingredient =
            meal[`strIngredient${i}`];

        const measure =
            meal[`strMeasure${i}`];


        if (
            ingredient &&
            ingredient.trim() !== ""
        ) {

            ingredients.push({

                ingredient:
                    ingredient.trim(),

                measure:
                    measure
                        ? `${measure.trim()} `
                        : ""

            });

        }
    }

    return ingredients;
}


/* =========================
   FAVORITE LOGIC
   ========================= */

function toggleFavorite(meal) {

    const existingIndex =
        savedRecipes.findIndex(
            recipe =>
                recipe.idMeal === meal.idMeal
        );


    if (existingIndex !== -1) {

        savedRecipes.splice(
            existingIndex,
            1
        );

    } else {

        savedRecipes.push(meal);

    }


    localStorage.setItem(
        "savorlyFavorites",
        JSON.stringify(savedRecipes)
    );


    renderSavedRecipes();
}


function isRecipeSaved(id) {

    return savedRecipes.some(
        recipe =>
            recipe.idMeal === id
    );
}


/* =========================
   SAVED RECIPES
   ========================= */

savedButton.addEventListener(
    "click",
    showSavedRecipes
);


function showSavedRecipes() {

    homeScreen.classList.add("hidden");

    detailsScreen.classList.add("hidden");

    savedScreen.classList.remove(
        "hidden"
    );

    renderSavedRecipes();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function renderSavedRecipes() {

    savedGrid.innerHTML = "";

    if (savedRecipes.length === 0) {

        savedGrid.innerHTML = `

            <div class="message">

                <p>
                    You haven't saved any recipes yet.
                </p>

            </div>

        `;

        return;
    }


    savedRecipes.forEach(meal => {

        const card =
            createRecipeCard(meal);

        savedGrid.appendChild(card);

    });
}


/* =========================
   NAVIGATION
   ========================= */

backButton.addEventListener(
    "click",
    () => {

        detailsScreen.classList.add(
            "hidden"
        );

        homeScreen.classList.remove(
            "hidden"
        );

    }
);


savedBackButton.addEventListener(
    "click",
    () => {

        savedScreen.classList.add(
            "hidden"
        );

        homeScreen.classList.remove(
            "hidden"
        );

    }
);


homeLogo.addEventListener(
    "click",
    () => {

        detailsScreen.classList.add(
            "hidden"
        );

        savedScreen.classList.add(
            "hidden"
        );

        homeScreen.classList.remove(
            "hidden"
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/* =========================
   LOADING
   ========================= */

function showLoading() {

    loading.classList.remove(
        "hidden"
    );
}


function hideLoading() {

    loading.classList.add(
        "hidden"
    );
}


/* =========================
   MESSAGES
   ========================= */

function showMessage(text) {

    message.textContent = text;

    message.classList.remove(
        "hidden"
    );
}


function hideMessage() {

    message.classList.add(
        "hidden"
    );
}


/* =========================
   INITIAL STATE
   ========================= */

renderSavedRecipes();