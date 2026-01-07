import axios from 'axios';

const API_URL = 'http://localhost:3000';
const NUM_USERS = 10000;
const BATCH_SIZE = 100; // Process 100 users at a time
const BATCH_DELAY = 500; // 500ms delay between batches

interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
}

async function createUser(index: number): Promise<boolean> {
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
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `✗ User ${index} failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
      );
    } else {
      console.error(`✗ User ${index} failed:`, error);
    }
    return false;
  }
}

async function testLoad() {
  console.log(`🚀 Starting load test: Creating ${NUM_USERS} users...`);
  console.log(`📍 Target: ${API_URL}/users`);
  console.log(`📦 Batch size: ${BATCH_SIZE} users`);
  console.log(`⏱️  Batch delay: ${BATCH_DELAY}ms`);
  console.log('');

  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;

  // Process in batches
  const totalBatches = Math.ceil(NUM_USERS / BATCH_SIZE);

  for (let i = 0; i < NUM_USERS; i += BATCH_SIZE) {
    const batchEnd = Math.min(i + BATCH_SIZE, NUM_USERS);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    console.log(
      `\n📦 Batch ${batchNum}/${totalBatches} - Processing users ${i + 1} to ${batchEnd}...`,
    );

    const batchPromises: Promise<boolean>[] = [];
    for (let j = i; j < batchEnd; j++) {
      batchPromises.push(createUser(j + 1));
    }

    const results = await Promise.all(batchPromises);
    const batchSuccess = results.filter((r) => r).length;
    const batchFailures = results.length - batchSuccess;

    successCount += batchSuccess;
    failureCount += batchFailures;

    console.log(`   ✓ Success: ${batchSuccess} | ✗ Failed: ${batchFailures}`);

    // Delay between batches (except for the last batch)
    if (batchEnd < NUM_USERS) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('═'.repeat(60));
  console.log(`✅ Load test completed in ${duration} seconds`);
  console.log(
    `📊 Total Success: ${successCount} (${((successCount / NUM_USERS) * 100).toFixed(1)}%)`,
  );
  console.log(
    `📊 Total Failed: ${failureCount} (${((failureCount / NUM_USERS) * 100).toFixed(1)}%)`,
  );
  console.log(
    `📊 Throughput: ${(NUM_USERS / parseFloat(duration)).toFixed(2)} users/second`,
  );
  console.log('═'.repeat(60));
  console.log('');
  console.log('📝 Next steps:');
  console.log('  1. Check application logs for event processing');
  console.log('  2. Verify RabbitMQ queue processed all events');
  console.log('  3. Check MailHog (http://localhost:8025) for welcome emails');
  console.log(`  4. Verify ${successCount} users exist in database`);
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
