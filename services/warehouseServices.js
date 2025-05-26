import warehouseRepository from "../repositories/warehouseRepository.js";

class WarehouseService {
  async createWarehouse(productData) {
    return await warehouseRepository.create(productData);
  }

  async findWarehouse(filterQuery) {
    return await warehouseRepository.findOneById(
      { _id: filterQuery.id }, //filterQuery
      {}, //projection
      {
        skipPopulate: true,
      }
    );
  }

  async findAllWarehouses(request) {
    return await warehouseRepository.find(
      {}, //filterQuery
      { _id: 1, name: 1, manager: 1, products: 1, image: 1 }, //projection
      {
        skipPopulate: true,
      }
    );
  }

  async updateWarehouse(filterQuery, productData) {
    return await warehouseRepository.findOneAndUpdate(
      { _id: filterQuery.id },
      productData
    );
  }

  async deleteWarehouse(filterQuery) {
    return await warehouseRepository.findOneAndDelete({ _id: filterQuery.id });
  }
}

export default new WarehouseService();
