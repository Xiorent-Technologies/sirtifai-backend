/**
 * Sequelize models index
 * Centralized export of all Sequelize models for easy importing
 */

import { defineUserModel } from './User.js';
import { defineTokenModel } from './Token.js';

/**
 * Initialize all Sequelize models
 * @param {Object} sequelize - Sequelize instance
 * @returns {Object} - Object containing all models
 */
export const initializeModels = (sequelize) => {
  const User = defineUserModel(sequelize);
  const Token = defineTokenModel(sequelize);

  // Define associations
  User.hasMany(Token, {
    foreignKey: 'userId',
    as: 'tokens',
    onDelete: 'CASCADE',
  });

  Token.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  return {
    User,
    Token,
  };
};

export default initializeModels;
