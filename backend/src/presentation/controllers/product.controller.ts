import { Request, Response } from 'express';
import { ProductService } from '../../application/product.service';

const productService = new ProductService();

export class ProductController {
  async getAllProducts(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      let storeId = req.query.storeId as string | undefined;

      // Kasir hanya bisa melihat produk cabang mereka sendiri
      if (user?.role === 'CASHIER' && user?.store?.id) {
        storeId = user.store.id;
      }

      const products = await productService.getAllProducts(storeId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = req.body;

      if (user?.role === 'CASHIER' && user?.store?.id) {
        data.storeId = user.store.id;
      }

      if (!data.storeId) {
        return res.status(400).json({ message: 'storeId is required to create a product' });
      }

      console.log('--- Incoming createProduct request ---', data);
      const product = await productService.createProduct(data);
      console.log('--- Successfully created product ---', product.id);
      res.status(201).json(product);
    } catch (error: any) {
      console.error('--- Error creating product ---', error);
      res.status(500).json({ message: 'Error creating product', error: error.message });
    }
  }

  async createBulkProducts(req: Request, res: Response) {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: 'Request body must be an array of products' });
      }
      
      const user = (req as any).user;
      const products = req.body.map(p => {
        if (user?.role === 'CASHIER' && user?.store?.id) {
          return { ...p, storeId: user.store.id };
        }
        return p;
      });

      if (products.some(p => !p.storeId)) {
        return res.status(400).json({ message: 'storeId is required for all products' });
      }

      console.log(`--- Incoming createBulkProducts request with ${products.length} items ---`);
      const createdProducts = await productService.createBulkProducts(products);
      console.log(`--- Successfully bulk created ${createdProducts.length} products ---`);
      res.status(201).json(createdProducts);
    } catch (error: any) {
      console.error('--- Error in createBulkProducts ---', error);
      res.status(500).json({ message: 'Error bulk creating products', error: error.message });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating product', error: error.message });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
  }
}
