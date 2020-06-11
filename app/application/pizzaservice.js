const PizzaRepository = require('../infraestructure/pizzarepository')
const Pizza = require('../domain/pizza')
const { NotExistsError } = require('../utils/customerrors')
const IngredientRepository = require('../infraestructure/ingredientrepository')
const profit = require('../utils/profit')
const Comment = require('../domain/comment')

class PizzaService {
    constructor() {
        this.repository = new PizzaRepository();
    }
    async create(dto) {
        await this.sanitizeIngredients(dto);
        const pizza = Pizza.create(dto);
        return await this.repository.add(pizza)
    }
    async get(id) {
        const pizza = await this.repository.get(id)
        if (!pizza) {
            throw new NotExistsError(`can't find pizza`)
        }
        await this.normalizePizza(pizza);
        return pizza;
    }
    async update(id, dto) {
        const pizza = await this.repository.get(id);
        if (!pizza) {
            throw new NotExistsError(`can't find pizza`)
        }
        await this.sanitizeIngredients(dto);
        pizza.update(dto)
        return await this.repository.update(pizza);
    }
    async dispose() {
        await this.repository.dispose();
    }
    async sanitizeIngredients(dto) {
        const repositoryIngredient = new IngredientRepository();
        dto.ingredients.forEach(async (element, index) => {
            const ingredient = await repositoryIngredient.get(element.id);
            if (!ingredient) {
                throw NotExistsError(`ingredient ${element.name} not exists`)
            }
            const { id, price } = ingredient;
            dto.ingredients[index] = { id, price }
        });
        await repositoryIngredient.dispose();
    }
    /**  */
    async normalizePizza(dto) {
        dto.price = 0;
        const repositoryIngredient = new IngredientRepository();
        dto.ingredients.forEach(async (element, index) => {
            const ingredient = await repositoryIngredient.get(element.id);
            if (ingredient) {
                const { id, name, price } = ingredient;
                dto.ingredients[index] = { id, name };
                dto.price = dto.price + price;
            }
        });
        dto.price = profit(dto.price);
        await repositoryIngredient.dispose();
    }
    async addComment(idPizza, dto) {
        const pizza = await this.repository.get(idPizza)
        if (!pizza) {
            throw new NotExistsError(`can't find pizza`)
        }
        const comment = new Comment(dto);
        pizza.addComment(comment);
        await this.repository.update(pizza);
        return comment;
    }
}

module.exports = PizzaService;