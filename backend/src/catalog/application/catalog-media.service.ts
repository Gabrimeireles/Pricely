import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

import { PrismaService } from '../../persistence/prisma.service';

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

@Injectable()
export class CatalogMediaService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadCatalogProductImage(
    catalogProductId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    this.validateImageFile(file);

    const existing = await this.prisma.catalogProduct.findUnique({
      where: { id: catalogProductId },
    });

    if (!existing) {
      throw new NotFoundException('Catalog product was not found');
    }

    const fileName = this.writeFile('catalog-products', catalogProductId, file);
    return this.prisma.catalogProduct.update({
      where: { id: catalogProductId },
      data: {
        imageUrl: `/media/catalog-products/${fileName}`,
      },
      include: {
        aliases: true,
        productVariants: true,
        _count: {
          select: {
            productOffers: true,
          },
        },
      },
    });
  }

  async uploadProductVariantImage(
    productVariantId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    this.validateImageFile(file);

    const existing = await this.prisma.productVariant.findUnique({
      where: { id: productVariantId },
    });

    if (!existing) {
      throw new NotFoundException('Product variant was not found');
    }

    const fileName = this.writeFile('product-variants', productVariantId, file);
    return this.prisma.productVariant.update({
      where: { id: productVariantId },
      data: {
        imageUrl: `/media/product-variants/${fileName}`,
      },
    });
  }

  getCatalogProductMedia(fileName: string) {
    return this.buildStream('catalog-products', fileName);
  }

  getProductVariantMedia(fileName: string) {
    return this.buildStream('product-variants', fileName);
  }

  private validateImageFile(file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  }) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Only PNG, JPEG, and WEBP images are supported');
    }
  }

  private writeFile(
    directory: 'catalog-products' | 'product-variants',
    entityId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const baseDirectory = this.resolveMediaDirectory(directory);
    mkdirSync(baseDirectory, { recursive: true });
    const extension = extname(file.originalname) || this.extensionForMimeType(file.mimetype);
    const fileName = `${entityId}-${Date.now()}${extension}`;
    writeFileSync(join(baseDirectory, fileName), file.buffer);
    return fileName;
  }

  private buildStream(directory: 'catalog-products' | 'product-variants', fileName: string) {
    const filePath = join(this.resolveMediaDirectory(directory), fileName);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Image file was not found');
    }

    return new StreamableFile(createReadStream(filePath));
  }

  private resolveMediaDirectory(directory: 'catalog-products' | 'product-variants') {
    return resolve(
      process.env.PRODUCT_MEDIA_DIR || join(process.cwd(), 'uploads'),
      directory,
    );
  }

  private extensionForMimeType(mimeType: string) {
    if (mimeType === 'image/png') {
      return '.png';
    }
    if (mimeType === 'image/webp') {
      return '.webp';
    }
    return '.jpg';
  }
}
