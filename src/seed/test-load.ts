import axios from 'axios';

const API_URL = 'http://localhost:3000';
const NUM_USERS = 100;

interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
}

async function createUser(index: number): Promise<void> {
  const user: CreateUserDto = {
    email: `testuser${index}@example.com`,
    firstName: `Test${index}`,
    lastName: `User${index}`,
    password: 'password123',
    roleId: 'user-role-id',
  };

  try {
    const response = await axios.post(`${API_URL}/users`, user);
    console.log(`✓ User ${index} created: ${response.data.id}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `✗ User ${index} failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
      );
    } else {
      console.error(`✗ User ${index} failed:`, error);
    }
  }
}

async function testLoad() {
  console.log(`🚀 Starting load test: Creating ${NUM_USERS} users...`);
  console.log(`📍 Target: ${API_URL}/users`);
  console.log('');

  const startTime = Date.now();

  const promises = Array.from({ length: NUM_USERS }, (_, i) =>
    createUser(i + 1),
  );

  await Promise.all(promises);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('');
  console.log(`✅ Load test completed in ${duration} seconds`);
  console.log(
    `📊 Average: ${(NUM_USERS / parseFloat(duration)).toFixed(2)} users/second`,
  );
  console.log('');
  console.log('📝 Check your logs for:');
  console.log('  - Event processing messages');
  console.log('  - RabbitMQ publishing logs');
  console.log('  - Handler execution logs');
  console.log('  - Email sending logs');
  console.log('');
  console.log('📧 Check MailHog (http://localhost:8025) for welcome emails');
}

testLoad()
  .then(() => {
    console.log('🎉 Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
