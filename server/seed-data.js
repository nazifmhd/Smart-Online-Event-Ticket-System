const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Event = require('./models/Event');
const Ticket = require('./models/Ticket');
const Payment = require('./models/Payment');

// Sri Lankan cities and venues
const sriLankanCities = ['Colombo', 'Kandy', 'Galle', 'Negombo', 'Matara', 'Jaffna', 'Anuradhapura', 'Batticaloa', 'Ratnapura'];
const sriLankanVenues = {
  'Colombo': ['Nelum Pokuna Mahinda Rajapaksa Theatre', 'BMICH', 'Sugathadasa Stadium', 'Lionel Wendt Theatre', 'Mount Lavinia Hotel', 'Cinnamon Grand'],
  'Kandy': ['Temple of the Tooth', 'Kandy City Centre', 'Queen\'s Hotel', 'Earl\'s Regency Hotel'],
  'Galle': ['Galle Fort', 'Unawatuna Beach', 'Galle Face Hotel'],
  'Negombo': ['Negombo Beach', 'Jetwing Beach Hotel'],
  'Matara': ['Matara Beach', 'Star Fort'],
  'Jaffna': ['Jaffna Public Library', 'Jaffna Fort'],
  'Anuradhapura': ['Anuradhapura Sacred City'],
  'Batticaloa': ['Batticaloa Lagoon'],
  'Ratnapura': ['Ratnapura Gem Mines']
};

const categories = ['concert', 'sports', 'conference', 'workshop', 'exhibition', 'festival', 'other'];
const pricingCategories = ['VIP', 'Normal', 'Student', 'Early Bird', 'Group'];

// Dummy user data
const dummyUsers = [
  {
    name: 'Kamal Perera',
    email: 'kamal@example.com',
    password: 'password123',
    role: 'user',
    phone: '0712345678',
    isEmailVerified: true,
    address: {
      street: '123 Main Street',
      city: 'Colombo',
      state: 'Western Province',
      zipCode: '00500',
      country: 'Sri Lanka'
    }
  },
  {
    name: 'Samantha Jayawardena',
    email: 'samantha@example.com',
    password: 'password123',
    role: 'user',
    phone: '0771234567',
    isEmailVerified: true,
    address: {
      street: '456 Galle Road',
      city: 'Galle',
      state: 'Southern Province',
      zipCode: '80000',
      country: 'Sri Lanka'
    }
  },
  {
    name: 'Priya Fernando',
    email: 'priya@example.com',
    password: 'password123',
    role: 'user',
    phone: '0782345678',
    isEmailVerified: true,
    address: {
      street: '789 Kandy Road',
      city: 'Kandy',
      state: 'Central Province',
      zipCode: '20000',
      country: 'Sri Lanka'
    }
  },
  {
    name: 'Event Organizers Lanka',
    email: 'organizer@example.com',
    password: 'password123',
    role: 'organizer',
    phone: '0112345678',
    isEmailVerified: true,
    address: {
      street: 'Event Management Office',
      city: 'Colombo',
      state: 'Western Province',
      zipCode: '00100',
      country: 'Sri Lanka'
    }
  },
  {
    name: 'Sri Lanka Events Co',
    email: 'events@example.com',
    password: 'password123',
    role: 'organizer',
    phone: '0113456789',
    isEmailVerified: true,
    address: {
      street: 'Events Plaza',
      city: 'Kandy',
      state: 'Central Province',
      zipCode: '20000',
      country: 'Sri Lanka'
    }
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    phone: '0770000000',
    isEmailVerified: true,
    address: {
      street: 'Admin Office',
      city: 'Colombo',
      state: 'Western Province',
      zipCode: '00100',
      country: 'Sri Lanka'
    }
  }
];

// Generate dummy events
function generateDummyEvents(organizers) {
  const events = [];
  const today = new Date();
  
  const eventTemplates = [
    {
      title: 'Colombo Music Festival 2024',
      description: 'Join us for an amazing music festival featuring top Sri Lankan artists and international performers. Experience live performances, food stalls, and an unforgettable night of music and entertainment.',
      category: 'concert',
      tags: ['music', 'festival', 'live', 'entertainment'],
      features: ['Live Music', 'Food Stalls', 'Parking Available', 'Wheelchair Accessible']
    },
    {
      title: 'Cricket Championship Finals',
      description: 'Watch the most exciting cricket match of the year as the top teams compete for the championship title. Don\'t miss this thrilling sporting event!',
      category: 'sports',
      tags: ['cricket', 'sports', 'championship'],
      features: ['Live Commentary', 'Food & Beverages', 'Parking Available']
    },
    {
      title: 'Tech Innovation Conference 2024',
      description: 'A premier technology conference featuring industry leaders, innovative startups, and cutting-edge technologies. Network with professionals and discover the future of tech.',
      category: 'conference',
      tags: ['technology', 'innovation', 'business', 'networking'],
      features: ['Keynote Speakers', 'Networking Session', 'Refreshments', 'Certificates']
    },
    {
      title: 'Traditional Dance Workshop',
      description: 'Learn traditional Sri Lankan dance forms from expert instructors. Perfect for beginners and intermediate dancers. Experience the rich cultural heritage of Sri Lanka.',
      category: 'workshop',
      tags: ['dance', 'culture', 'workshop', 'traditional'],
      features: ['Expert Instructors', 'Certificates', 'Refreshments']
    },
    {
      title: 'Art & Craft Exhibition',
      description: 'Explore beautiful artworks and handcrafted items from talented local artists. A perfect event for art enthusiasts and collectors.',
      category: 'exhibition',
      tags: ['art', 'craft', 'exhibition', 'culture'],
      features: ['Art Sales', 'Live Demonstrations', 'Refreshments']
    },
    {
      title: 'Esala Perahera Festival',
      description: 'Experience the grand Esala Perahera, one of Sri Lanka\'s most spectacular cultural festivals featuring traditional dancers, drummers, and beautifully decorated elephants.',
      category: 'festival',
      tags: ['culture', 'festival', 'traditional', 'perahera'],
      features: ['Traditional Procession', 'Food Stalls', 'Cultural Performances']
    },
    {
      title: 'Beach Volleyball Tournament',
      description: 'Join us for an exciting beach volleyball tournament featuring teams from across Sri Lanka. Cheer for your favorite team and enjoy a day at the beach!',
      category: 'sports',
      tags: ['volleyball', 'beach', 'sports', 'tournament'],
      features: ['Beach Access', 'Food & Drinks', 'Live Commentary']
    },
    {
      title: 'Jazz Night at Mount Lavinia',
      description: 'An elegant evening of smooth jazz music at the historic Mount Lavinia Hotel. Enjoy great music, fine dining, and breathtaking ocean views.',
      category: 'concert',
      tags: ['jazz', 'music', 'dining', 'elegant'],
      features: ['Fine Dining', 'Ocean View', 'Live Jazz', 'Parking']
    },
    {
      title: 'Business Networking Meetup',
      description: 'Connect with entrepreneurs, business leaders, and professionals from various industries. Great opportunity for networking and business growth.',
      category: 'conference',
      tags: ['business', 'networking', 'entrepreneurship'],
      features: ['Networking Session', 'Refreshments', 'Guest Speakers']
    },
    {
      title: 'Cooking Masterclass - Sri Lankan Cuisine',
      description: 'Learn to cook authentic Sri Lankan dishes from master chefs. Includes hands-on cooking experience and recipe booklet.',
      category: 'workshop',
      tags: ['cooking', 'food', 'workshop', 'culinary'],
      features: ['Hands-on Cooking', 'Recipe Booklet', 'Lunch Included']
    },
    {
      title: 'Photography Exhibition - Beautiful Sri Lanka',
      description: 'A stunning collection of photographs showcasing the natural beauty and cultural heritage of Sri Lanka by renowned photographers.',
      category: 'exhibition',
      tags: ['photography', 'nature', 'culture', 'exhibition'],
      features: ['Photo Sales', 'Meet the Photographers', 'Refreshments']
    },
    {
      title: 'New Year Music Concert',
      description: 'Celebrate the new year with an amazing concert featuring popular Sri Lankan musicians. Fireworks and celebrations included!',
      category: 'concert',
      tags: ['music', 'new year', 'celebration', 'festival'],
      features: ['Fireworks', 'Food Stalls', 'Live Music', 'Parking']
    }
  ];

  eventTemplates.forEach((template, index) => {
    const city = sriLankanCities[index % sriLankanCities.length];
    const venues = sriLankanVenues[city] || [city + ' Event Hall'];
    const venue = venues[index % venues.length];
    
    // Set dates - mix of upcoming and past events
    const daysOffset = (index * 7) - 14; // Some past, some future
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + daysOffset);
    startDate.setHours(14, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(22, 0, 0, 0);
    
    // Generate pricing categories
    const pricingCategoriesData = [];
    const basePrice = [5000, 3000, 1500, 1000, 2000];
    const categoryNames = ['VIP', 'Normal', 'Student', 'Early Bird', 'Group'];
    
    categoryNames.forEach((name, i) => {
      const totalTickets = name === 'VIP' ? 50 : name === 'Normal' ? 200 : 100;
      pricingCategoriesData.push({
        name: name,
        price: basePrice[i],
        totalTickets: totalTickets,
        availableTickets: Math.floor(totalTickets * (0.7 + Math.random() * 0.3)) // 70-100% available
      });
    });
    
    events.push({
      title: template.title,
      description: template.description,
      category: template.category,
      tags: template.tags,
      features: template.features,
      date: {
        startDate: startDate,
        endDate: endDate,
        time: {
          startTime: '14:00',
          endTime: '22:00'
        },
        timezone: 'Asia/Colombo'
      },
      location: {
        venue: venue,
        address: {
          street: `${index + 1} Event Street`,
          city: city,
          state: 'Province',
          zipCode: '00000',
          country: 'Sri Lanka'
        },
        coordinates: {
          latitude: 6.9271 + (Math.random() - 0.5) * 0.5,
          longitude: 79.8612 + (Math.random() - 0.5) * 0.5
        }
      },
      pricing: {
        categories: pricingCategoriesData,
        currency: 'LKR'
      },
      organizer: organizers[index % organizers.length]._id,
      status: ['draft', 'published', 'published', 'published'][index % 4],
      images: [],
      analytics: {
        views: Math.floor(Math.random() * 1000),
        ticketsSold: Math.floor(Math.random() * 50),
        revenue: Math.floor(Math.random() * 500000)
      },
      capacity: pricingCategoriesData.reduce((sum, cat) => sum + cat.totalTickets, 0),
      minAge: template.category === 'concert' ? 18 : 0
    });
  });

  return events;
}

// Main seed function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database - Force local MongoDB for seeding
    const mongoUri = 'mongodb://localhost:27017/smart-event-tickets';
    console.log(`🔗 Connecting to: ${mongoUri}`);
    console.log('💡 Using local MongoDB for seeding (ignoring .env if present)\n');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Event.deleteMany({});
    await Ticket.deleteMany({});
    await Payment.deleteMany({});
    console.log('✅ Database cleared\n');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of dummyUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`   ✅ Created user: ${user.name} (${user.role})`);
    }
    console.log(`\n✅ Created ${createdUsers.length} users\n`);

    // Get organizers
    const organizers = createdUsers.filter(u => u.role === 'organizer' || u.role === 'admin');
    
    // Create events
    console.log('🎪 Creating events...');
    const events = generateDummyEvents(organizers);
    const createdEvents = [];
    for (const eventData of events) {
      const event = new Event(eventData);
      await event.save();
      createdEvents.push(event);
      console.log(`   ✅ Created event: ${event.title} in ${event.location.address.city}`);
    }
    console.log(`\n✅ Created ${createdEvents.length} events\n`);

    // Create some tickets and payments for published events
    console.log('🎫 Creating tickets and payments...');
    const publishedEvents = createdEvents.filter(e => e.status === 'published');
    const regularUsers = createdUsers.filter(u => u.role === 'user');
    
    let ticketCount = 0;
    let paymentCount = 0;

    for (let i = 0; i < Math.min(publishedEvents.length, 5); i++) {
      const event = publishedEvents[i];
      const user = regularUsers[i % regularUsers.length];
      const pricingCategory = event.pricing.categories[Math.floor(Math.random() * event.pricing.categories.length)];
      
      if (pricingCategory.availableTickets > 0) {
        // Create payment
        const payment = new Payment({
          user: user._id,
          event: event._id,
          paymentId: `PAY-${Date.now()}-${i}`,
          amount: {
            total: pricingCategory.price,
            subtotal: pricingCategory.price,
            currency: 'LKR'
          },
          paymentMethod: {
            type: ['credit_card', 'mobile_wallet', 'bank_transfer'][i % 3],
            details: {}
          },
          billingAddress: {
            name: user.name,
            email: user.email,
            phone: user.phone
          },
          status: 'completed',
          gatewayResponse: {
            transactionId: `TXN-${Date.now()}-${i}`,
            status: 'success'
          }
        });
        await payment.save();
        paymentCount++;

        // Create ticket
        const ticket = new Ticket({
          user: user._id,
          event: event._id,
          payment: payment._id,
          ticketNumber: `TKT-${Date.now()}-${i}`,
          pricingCategory: {
            name: pricingCategory.name,
            price: pricingCategory.price
          },
          qrCode: {
            data: `QR-${event._id}-${user._id}-${Date.now()}-${i}`,
            image: ''
          },
          status: 'confirmed'
        });
        await ticket.save();
        ticketCount++;

        // Update event availability
        const categoryIndex = event.pricing.categories.findIndex(c => c.name === pricingCategory.name);
        if (categoryIndex !== -1) {
          event.pricing.categories[categoryIndex].availableTickets--;
          await event.save();
        }
      }
    }

    console.log(`   ✅ Created ${ticketCount} tickets`);
    console.log(`   ✅ Created ${paymentCount} payments\n`);

    // Summary
    console.log('='.repeat(60));
    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   🎪 Events: ${createdEvents.length}`);
    console.log(`   🎫 Tickets: ${ticketCount}`);
    console.log(`   💳 Payments: ${paymentCount}\n`);
    
    console.log('🔑 Test Accounts:');
    console.log('   👤 Regular User: kamal@example.com / password123');
    console.log('   🎪 Organizer: organizer@example.com / password123');
    console.log('   👨‍💼 Admin: admin@example.com / password123\n');
    
    console.log('🌐 You can now login and explore the system!\n');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run seeding
seedDatabase();
