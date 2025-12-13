import { connectDatabase } from '../config/database';
import { connectRedis } from '../config/redis';
import { User } from '../models/User';
import { Merchant } from '../models/Merchant';
import { Product } from '../models/Product';
import { Rider } from '../models/Rider';
import bcrypt from 'bcrypt';


const seed = async (): Promise<void> => {
  try {
    await connectDatabase();
    await connectRedis();

    console.log('🌱 Starting seed process...\n');

    // Clean existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Merchant.deleteMany({});
    // await Product.deleteMany({});
    // await Rider.deleteMany({});

    // 1. Create Admin User
    let admin = await User.findOne({ email: 'awaisjarral37@gmail.com' });
    if (!admin) {
      admin = await User.create({
        email: 'awaisjarral37@gmail.com',
        role: 'admin',
        name: 'Admin User',
        profileCompleted: true,
      });
      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('⚠️  Admin user already exists:', admin.email);
    }

    // 2. Create Shopkeeper (Merchant Owner)
    let shopkeeper = await User.findOne({ email: 'asadhanzlah@gmail.com' });
    if (!shopkeeper) {
      shopkeeper = await User.create({
        email: 'asadhanzlah@gmail.com',
        role: 'customer', // Will be updated to merchant_owner when merchant is created
        name: 'Shopkeeper',
        profileCompleted: false,
      });
      console.log('✅ Shopkeeper user created:', shopkeeper.email);
    } else {
      console.log('⚠️  Shopkeeper user already exists:', shopkeeper.email);
    }

    // 3. Create Merchant/Shop
    let merchant = await Merchant.findOne({ ownerUserId: shopkeeper._id });
    if (!merchant) {
      merchant = await Merchant.create({
        ownerUserId: shopkeeper._id,
        names: {
          en: 'BridgeFrame Store',
          ur: 'برج فریم دکان',
        },
        shopAddress: {
          text: {
            en: 'House 123, Main Street, Islamabad',
            ur: 'گھر 123، مرکزی سڑک، اسلام آباد',
          },
          street: 'Main Street',
        },
        geo: {
          type: 'Point',
          coordinates: [73.751, 33.148], // [lng, lat] - Islamabad coordinates
        },
        deliveryRadiusMeters: 5000,
        deliveryCharge: 100,
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
        isApproved: true, // Auto-approved for seed data
        verification: {
          adminId: admin._id,
          verifiedAt: new Date(),
          notes: 'Seed data - auto-approved',
        },
        settings: {
          autoAcceptOrders: false,
          maxDeliverySlotsPerDay: 50,
        },
        riders: [],
      });

      // Update shopkeeper role to merchant_owner
      await User.findByIdAndUpdate(shopkeeper._id, {
        role: 'merchant_owner',
        profileCompleted: true,
      });

      console.log('✅ Merchant created:', merchant.names.en);
    } else {
      console.log('⚠️  Merchant already exists:', merchant.names.en);
    }

    // 4. Create Products
    const products = [
      {
        merchantId: merchant._id,
        sku: 'PROD001',
        names: { en: 'Fresh Milk', ur: 'تازہ دودھ' },
        description: { en: 'Fresh cow milk, 1 liter', ur: 'تازہ گائے کا دودھ، 1 لیٹر' },
        images: [{ url: 'https://via.placeholder.com/400?text=Milk', publicId: 'milk-1' }],
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
        names: { en: 'White Bread', ur: 'سفید روٹی' },
        description: { en: 'Fresh white bread, 500g', ur: 'تازہ سفید روٹی، 500 گرام' },
        images: [{ url: 'https://via.placeholder.com/400?text=Bread', publicId: 'bread-1' }],
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
        names: { en: 'Farm Eggs', ur: 'فارم انڈے' },
        description: { en: 'Farm fresh eggs, 12 pieces', ur: 'فارم سے تازہ انڈے، 12 عدد' },
        images: [{ url: 'https://via.placeholder.com/400?text=Eggs', publicId: 'eggs-1' }],
        price: 200,
        stock: 30,
        unit: 'dozen',
        category: 'Dairy',
        tags: ['eggs', 'dairy'],
        active: true,
      },
      {
        merchantId: merchant._id,
        sku: 'PROD004',
        names: { en: 'Cooking Oil', ur: 'کھانا پکانے کا تیل' },
        description: { en: 'Premium cooking oil, 1 liter', ur: 'پریمیم کھانا پکانے کا تیل، 1 لیٹر' },
        images: [{ url: 'https://via.placeholder.com/400?text=Oil', publicId: 'oil-1' }],
        price: 450,
        stock: 40,
        unit: 'liter',
        category: 'Cooking',
        tags: ['oil', 'cooking'],
        active: true,
      },
      {
        merchantId: merchant._id,
        sku: 'PROD005',
        names: { en: 'Basmati Rice', ur: 'باسمتی چاول' },
        description: { en: 'Premium basmati rice, 5kg', ur: 'پریمیم باسمتی چاول، 5 کلو' },
        images: [{ url: 'https://via.placeholder.com/400?text=Rice', publicId: 'rice-1' }],
        price: 1200,
        stock: 25,
        unit: 'bag',
        category: 'Grains',
        tags: ['rice', 'grains'],
        active: true,
      },
      {
        merchantId: merchant._id,
        sku: 'PROD006',
        names: { en: 'Sugar', ur: 'چینی' },
        description: { en: 'White sugar, 1kg', ur: 'سفید چینی، 1 کلو' },
        images: [{ url: 'https://via.placeholder.com/400?text=Sugar', publicId: 'sugar-1' }],
        price: 150,
        stock: 60,
        unit: 'kg',
        category: 'Pantry',
        tags: ['sugar', 'sweetener'],
        active: true,
      },
    ];

    const existingProducts = await Product.countDocuments({ merchantId: merchant._id });
    if (existingProducts === 0) {
      const createdProducts = await Product.insertMany(products);
      console.log(`✅ Created ${createdProducts.length} products`);
    } else {
      console.log(`⚠️  ${existingProducts} products already exist for this merchant`);
    }

    // 5. Create Rider
    let riderUser = await User.findOne({ email: 'rider@dukaan.com' });
    if (!riderUser) {
      riderUser = await User.create({
        email: 'rider@dukaan.com',
        role: 'rider',
        name: 'Rider',
        phone: '+923001234567',
        profileCompleted: true,
        passwordHash: await bcrypt.hash('rider123', 10),
      });
      console.log('✅ Rider user created:', riderUser.email);
    } else {
      console.log('⚠️  Rider user already exists:', riderUser.email);
    }

    let rider = await Rider.findOne({ userId: riderUser._id });
    if (!rider) {
      rider = await Rider.create({
        merchantId: merchant._id,
        userId: riderUser._id,
        name: 'Test Rider',
        phone: '+923001234567',
        vehicleType: 'Motorcycle',
        active: true,
        earnings: {
          today: 0,
          week: 0,
          total: 0,
        },
      });

      // Add rider to merchant
      await Merchant.findByIdAndUpdate(merchant._id, {
        $push: { riders: rider._id },
      });

      console.log('✅ Rider created:', rider.name);
    } else {
      console.log('⚠️  Rider already exists:', rider.name);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Admin: ${admin.email}`);
    console.log(`   - Shopkeeper: ${shopkeeper.email}`);
    console.log(`   - Merchant: ${merchant.names.en} (ID: ${merchant._id})`);
    console.log(`   - Products: ${await Product.countDocuments({ merchantId: merchant._id })}`);
    console.log(`   - Rider: ${riderUser.email}`);
    console.log('\n💡 You can now login using OTP with these email addresses.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();

