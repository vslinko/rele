import {singleResourceAction, collectionAction} from '../utils/releActionHelpers';

export const category = singleResourceAction({
  url: '/api/categories/:id',
  type: 'Category'
});

export const items = collectionAction({
  url: '/api/items',
  type: 'Item',
  parent: {
    Category: {
      params: category => `filter[category]=${category.id}`,
      filter: (item, category) => item.relationships.category.data.id === category.id
    }
  }
});
