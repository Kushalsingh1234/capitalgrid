import FarmBuilding from './buildings/FarmBuilding';
import MineBuilding from './buildings/MineBuilding';
import AutomobileFactoryBuilding from './buildings/AutomobileFactoryBuilding';
import ConstructionBuilding from './buildings/ConstructionBuilding';
import FoodProcessingBuilding from './buildings/FoodProcessingBuilding';
import GarmentBuilding from './buildings/GarmentBuilding';
import ElectronicsCampusBuilding from './buildings/ElectronicsCampusBuilding';
import RetailBuilding from './buildings/RetailBuilding';

export default class BuildingRenderer {
  /**
   * Factory function that maps a building config payload to its concrete vector rendering container
   * and mounts it directly inside the active Phaser Scene.
   * @param {Phaser.Scene} scene - The active GameScene instance.
   * @param {Object} buildingData - Configuration containing coordinates, level, rotation and businessType.
   * @returns {BaseBuilding} - The initialized building game object container.
   */
  static create(scene, buildingData) {
    if (!buildingData || !buildingData.businessType) {
      console.warn('[BuildingRenderer] No businessType provided. Defaulting to RetailBuilding.');
      return new RetailBuilding(scene, buildingData || {});
    }

    const type = buildingData.businessType.trim().toLowerCase();

    // Map business type string to corresponding concrete class
    switch (type) {
      case 'farming':
      case 'dairy':
      case 'agriculture':
        return new FarmBuilding(scene, buildingData);

      case 'automobile manufacturing':
      case 'automobile':
        return new AutomobileFactoryBuilding(scene, buildingData);

      case 'mining':
      case 'mine':
        return new MineBuilding(scene, buildingData);

      case 'construction factory':
      case 'construction':
        return new ConstructionBuilding(scene, buildingData);

      case 'food processing factory':
      case 'food processing':
        return new FoodProcessingBuilding(scene, buildingData);

      case 'garment factory':
      case 'garment':
      case 'textile':
        return new GarmentBuilding(scene, buildingData);

      case 'electronics manufacturing':
      case 'electronics':
        return new ElectronicsCampusBuilding(scene, buildingData);

      case 'clothing store':
      case 'electronics store':
      case 'restaurant':
      case 'car showroom':
      case 'retail':
        return new RetailBuilding(scene, buildingData);

      default:
        console.warn(`[BuildingRenderer] Unrecognized businessType "${buildingData.businessType}". Falling back to RetailBuilding.`);
        return new RetailBuilding(scene, buildingData);
    }
  }
}
