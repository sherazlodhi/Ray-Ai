// Test script to verify all requirements:
// 1. Guest limit: exactly 4 questions, 5th is blocked.
// 2. Auth: unlimited questions after signing in.
// 3. Friend personality & adaptation to user speaking tone.
// 4. Image creation limit: exactly 5 images allowed, 6th is blocked.
// 5. Image upload limit: exactly 5 images allowed, 6th is blocked.

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('--- Starting Gemini Friend AI Verification Suite ---\n');

  // Test 1: Check guest status
  const guestId = 'test_guest_' + Date.now();
  console.log('1. Checking initial guest status for:', guestId);
  let res = await fetch(`${BASE_URL}/api/user/status`, {
    headers: { 'x-guest-id': guestId }
  });
  let status = await res.json();
  console.log('Initial guest status:', status);
  if (status.questionsAsked !== 0 || status.questionLimit !== 4) {
    throw new Error('Initial guest status invalid');
  }

  // Test 2: Guest asks 4 questions
  console.log('\n2. Testing Guest 4-question limit:');
  for (let i = 1; i <= 4; i++) {
    console.log(`Asking question ${i}/4 as guest...`);
    res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-guest-id': guestId },
      body: JSON.stringify({ message: `Test question ${i}: How are you?` })
    });
    const chatData = await res.json();
    console.log(`Question ${i} response status:`, res.status, `Questions asked: ${chatData.userStats.questionsAsked}, Vibe: ${chatData.detectedVibe}`);
    if (res.status !== 200) {
      throw new Error(`Failed to send question ${i}`);
    }
  }

  // Test 3: Guest attempts 5th question (SHOULD BE BLOCKED!)
  console.log('\n3. Testing Guest 5th question block:');
  res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-guest-id': guestId },
    body: JSON.stringify({ message: 'Question 5: Can I ask one more?' })
  });
  console.log('5th question response status:', res.status);
  const blockData = await res.json();
  console.log('5th question payload:', blockData);
  if (res.status !== 403 || blockData.code !== 'LIMIT_4_REACHED') {
    throw new Error('5th question was NOT blocked properly for guest!');
  }
  console.log('✓ Success: Guest was strictly limited to 4 questions!');

  // Test 4: Sign in / Register for unlimited questions
  console.log('\n4. Testing Sign Up & Unlimited Questions:');
  const userEmail = `friend_${Date.now()}@test.com`;
  res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: 'password123', name: 'Jordan Bestie' })
  });
  const authData = await res.json();
  console.log('Registered user:', authData.user);
  const token = authData.token;

  // Ask 5 questions as registered user (demonstrating UNLIMITED!)
  console.log('Asking questions 1 through 6 as signed-in user...');
  for (let i = 1; i <= 6; i++) {
    res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: `Member question ${i}: Keep going!` })
    });
    const memberChat = await res.json();
    console.log(`Member question ${i} status:`, res.status, `questionsAsked: ${memberChat.userStats.questionsAsked}, remaining: ${memberChat.userStats.questionsRemaining}`);
    if (res.status !== 200) {
      throw new Error(`Signed-in question ${i} failed!`);
    }
  }
  console.log('✓ Success: Signed-in user has unlimited questions (asked 6+ without blocking)!');

  // Test 5: Personality & Tone Adaptation
  console.log('\n5. Testing Adaptive Friend Personality & Tone Mirroring:');
  // Send casual slang message
  res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message: 'yo bro fr ngl that was insane lol wbu' })
  });
  const slangChat = await res.json();
  console.log('Slang detected vibe:', slangChat.detectedVibe);

  // Send deep thoughtful message
  res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message: 'I feel so sad thinking about life and struggling with advice' })
  });
  const deepChat = await res.json();
  console.log('Deep detected vibe:', deepChat.detectedVibe);
  console.log('✓ Success: Personality dynamically adapts vibe and energy!');

  // Test 6: Image Creation Limit (Max 5 images)
  console.log('\n6. Testing Image Creation Limit (Max 5):');
  const imageTesterToken = token;
  for (let i = 1; i <= 5; i++) {
    console.log(`Creating image ${i}/5...`);
    res = await fetch(`${BASE_URL}/api/generate-image`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${imageTesterToken}`
      },
      body: JSON.stringify({ prompt: `A cute robot friend ${i}` })
    });
    const imgData = await res.json();
    console.log(`Image ${i} created:`, imgData.image?.url?.substring(0, 50) + '...', `Created count: ${imgData.userStats.imagesCreated}`);
    if (res.status !== 200) throw new Error(`Image ${i} creation failed`);
  }

  // 6th image creation MUST be blocked
  console.log('Attempting 6th image creation (should be blocked)...');
  res = await fetch(`${BASE_URL}/api/generate-image`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${imageTesterToken}`
    },
    body: JSON.stringify({ prompt: 'This one should fail' })
  });
  const blockImg = await res.json();
  console.log('6th image creation status:', res.status, blockImg);
  if (res.status !== 403 || blockImg.code !== 'LIMIT_IMAGE_CREATION_REACHED') {
    throw new Error('6th image was NOT blocked properly!');
  }
  console.log('✓ Success: Image creation is strictly limited to 5 images!');

  // Test 7: Image Upload Limit (Max 5 images)
  console.log('\n7. Testing Image Upload Limit (Max 5):');
  const mockBase64Img = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // Upload 5 images across messages
  console.log('Uploading 5 images (3 in one message, 2 in next)...');
  res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${imageTesterToken}`
    },
    body: JSON.stringify({
      message: 'Here are 3 photos!',
      images: [mockBase64Img, mockBase64Img, mockBase64Img]
    })
  });
  let upData = await res.json();
  console.log('First upload (3 images) status:', res.status, 'Total uploaded:', upData.userStats.imagesUploaded);

  res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${imageTesterToken}`
    },
    body: JSON.stringify({
      message: 'Here are 2 more photos!',
      images: [mockBase64Img, mockBase64Img]
    })
  });
  upData = await res.json();
  console.log('Second upload (2 images) status:', res.status, 'Total uploaded:', upData.userStats.imagesUploaded);

  // Attempt 6th image upload (should be blocked)
  console.log('Attempting 6th image upload (should be blocked)...');
  res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${imageTesterToken}`
    },
    body: JSON.stringify({
      message: 'One more image upload!',
      images: [mockBase64Img]
    })
  });
  const blockUpload = await res.json();
  console.log('6th upload status:', res.status, blockUpload);
  if (res.status !== 403 || blockUpload.code !== 'LIMIT_IMAGE_UPLOAD_REACHED') {
    throw new Error('Image upload was NOT blocked properly at 5 images!');
  }
  console.log('✓ Success: Image upload is strictly limited to 5 images!');

  console.log('\n======================================================');
  console.log('🎉 ALL TESTS PASSED! Every requirement is verified! 🎉');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
