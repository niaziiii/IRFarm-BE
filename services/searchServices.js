import repositories from "../repositories/index.js";

class SearchService {
  async searchDocument(searchQuery) {
    let models = [
      { repo: "productRepository", fnc: "searchProduct" },
      { repo: "userRepository", fnc: "searchUser" },
    ];

    const searchPromises = models.map((item) => {
      const repository = repositories[item.repo];
      const searchFunction = repository[item.fnc];

      if (!searchFunction) {
        throw new Error(`Function ${item.fnc} not found in ${item.repo}`);
      }

      return searchFunction(searchQuery);
    });

    const [results] = await Promise.all(searchPromises);

    return results;
  }
}

export default new SearchService();
