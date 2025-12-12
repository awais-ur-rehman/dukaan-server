import bcrypt from 'bcrypt';
import { connectDatabase } from '../config/database';
import { connectRedis } from '../config/redis';
import { User } from '../models/User';
import { Merchant } from '../models/Merchant';
import { Product } from '../models/Product';
import { Rider } from '../models/Rider';

const seed = async (): Promise<void> => {
  try {
    await connectDatabase();
    await connectRedis();

    await User.deleteMany({});
    await Merchant.deleteMany({});
    await Product.deleteMany({});
    await Rider.deleteMany({});

    const admin = await User.create({
      email: 'admin@dukaan.com',
      role: 'admin',
      name: 'Admin User',
      profileCompleted: true,
    });

    const merchantOwner = await User.create({
      email: 'merchant@dukaan.com',
      role: 'merchant_owner',
      name: 'Merchant Owner',
      profileCompleted: true,
    });

    const customer = await User.create({
      email: 'customer@dukaan.com',
      role: 'customer',
      name: 'Test Customer',
      phone: '+923001234567',
      profileCompleted: true,
    });

    const merchant = await Merchant.create({
      ownerUserId: merchantOwner._id,
      names: {
        en: 'Ali Store',
        ur: 'علی دکان',
      },
      shopAddress: {
        text: {
          en: 'House 12, Street X, Mirpur',
          ur: 'گھر 12، سڑک X، میرپور',
        },
        street: 'Street X',
      },
      geo: {
        type: 'Point',
        coordinates: [73.751, 33.148],
      },
      deliveryRadiusMeters: 3000,
      deliveryCharge: 60,
      openingHours: [
        {
          day: 'mon',
          slots: [{ start: '09:00', end: '21:00' }],
        },
        {
          day: 'tue',
          slots: [{ start: '09:00', end: '21:00' }],
        },
        {
          day: 'wed',
          slots: [{ start: '09:00', end: '21:00' }],
        },
        {
          day: 'thu',
          slots: [{ start: '09:00', end: '21:00' }],
        },
        {
          day: 'fri',
          slots: [{ start: '09:00', end: '21:00' }],
        },
        {
          day: 'sat',
          slots: [{ start: '09:00', end: '21:00' }],
        },
        {
          day: 'sun',
          slots: [{ start: '10:00', end: '20:00' }],
        },
      ],
      isApproved: true,
      verification: {
        adminId: admin._id,
        verifiedAt: new Date(),
        notes: 'Approved for testing',
      },
      settings: {
        autoAcceptOrders: false,
        maxDeliverySlotsPerDay: 50,
      },
    });

    const riderUser = await User.create({
      email: 'rider@dukaan.com',
      role: 'rider',
      name: 'Test Rider',
      phone: '+923009876543',
      profileCompleted: true,
      passwordHash: await bcrypt.hash('rider123', 10),
    });

    const rider = await Rider.create({
      merchantId: merchant._id,
      userId: riderUser._id,
      name: 'Test Rider',
      phone: '+923009876543',
      vehicleType: 'Motorcycle',
      active: true,
      earnings: {
        today: 0,
        week: 0,
        total: 0,
      },
    });

    await merchant.updateOne({ $push: { riders: rider._id } });

    const products = await Product.insertMany([
      {
        merchantId: merchant._id,
        sku: 'PROD001',
        names: {
          en: 'Fresh Milk',
          ur: 'تازہ دودھ',
        },
        description: {
          en: 'Fresh cow milk, 1 liter',
          ur: 'تازہ گائے کا دودھ، 1 لیٹر',
        },
        images: [
          {
            url: 'https://example.com/milk.jpg',
            publicId: 'milk-1',
          },
        ],
        price: 250,
        stock: 100,
        unit: 'liter',
        category: 'Dairy',
        tags: ['dairy', 'milk', 'fresh'],
        active: true,
      },
      {
        merchantId: merchant._id,
        sku: 'PROD002',
        names: {
          en: 'Bread',
          ur: 'روٹی',
        },
        description: {
          en: 'Fresh white bread, 500g',
          ur: 'تازہ سفید روٹی، 500 گرام',
        },
        images: [
          {
            url: 'https://example.com/bread.jpg',
            publicId: 'bread-1',
          },
        ],
        price: 80,
        stock: 50,
        unit: 'pack',
        category: 'Bakery',
        tags: ['bread', 'bakery'],
        active: true,
      },
      {
        merchantId: merchant._id,
        sku: 'PROD003',
        names: {
          en: 'Eggs',
          ur: 'انڈے',
        },
        description: {
          en: 'Farm fresh eggs, 12 pieces',
          ur: 'فارم سے تازہ انڈے، 12 عدد',
        },
        images: [
          {
            url: 'https://example.com/eggs.jpg',
            publicId: 'eggs-1',
          },
        ],
        price: 200,
        stock: 30,
        unit: 'dozen',
        category: 'Dairy',
        tags: ['eggs', 'dairy'],
        active: true,
      },
    ]);

    console.log('✅ Seed data created successfully!');
    console.log('\n📋 Created:');
    console.log(`   - Admin: ${admin.email} (role: ${admin.role})`);
    console.log(`   - Merchant Owner: ${merchantOwner.email} (role: ${merchantOwner.role})`);
    console.log(`   - Customer: ${customer.email} (role: ${customer.role})`);
    console.log(`   - Rider: ${riderUser.email} (role: ${riderUser.role})`);
    console.log(`   - Merchant: ${merchant.names.en} (ID: ${merchant._id})`);
    console.log(`   - Products: ${products.length} products`);
    console.log(`   - Rider: ${rider.name} (ID: ${rider._id})`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();

