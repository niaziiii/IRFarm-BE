import mongoose from "mongoose";
import AppError from "../utils/apiError.js";
class AbstractRepository {
  constructor(model) {
    this.model = model;
  }

  async aggregate(pipeline) {
    return await this.model.aggregate(pipeline);
  }

  async create(data) {
    const document = new this.model(data);
    return await document.save();
  }

  async findOneById(filterQuery, projection = {}, options = {}) {
    const document = await this.model
      .findById(filterQuery, projection)
      .setOptions(options);
    if (!document) {
      throw new AppError(`${this.model.modelName} not found.`);
    }

    return document;
  }

  async find({ filterQuery, projection = {}, options = {}, sortParams = {} }) {
    //options={skipPopulate:true}
    return await this.model
      .find(filterQuery, projection)
      .sort(sortParams)
      .setOptions(options);
  }

  async findOneByQuery({ filterQuery = {}, projection = {}, sortParams = {} }) {
    return await this.model.findOne(filterQuery, projection).sort(sortParams);
  }

  async findOneAndUpdate(filterQuery, data) {
    await this.findOneById(filterQuery);
    return await this.model.findByIdAndUpdate(filterQuery, data, {
      new: true,
    });
  }
  async findByQueryAndUpdate(filterQuery, data) {
    return await this.model.findOneAndUpdate(filterQuery, data, {
      new: true,
    });
  }

  async findOneAndDelete(filterQuery) {
    const document = await this.findOneById(filterQuery);
    return await document.remove();
  }

  async runInTransaction(operations) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const results = {};
      for (const operation of operations) {
        results[operation.name] = await operation(this.model, session);
      }

      await session.commitTransaction();
      return results;
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(error.message);
    } finally {
      session.endSession();
    }
  }
}

export default AbstractRepository;
