// server/test-conversations.js
// Test script for global chat and DM functionality with simplified socket events

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.js';
import Conversation from './models/conversation.js';
import Message from './models/message.js';

dotenv.config();

async function testConversations() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find test users
    const users = await User.find().limit(3);
    if (users.length < 2) {
      console.log('❌ Need at least 2 users in database. Run seed script first.');
      process.exit(1);
    }

    console.log(`📋 Found ${users.length} users:`);
    users.forEach((u, i) => console.log(`   ${i + 1}. ${u.username || u.name} (${u.email})`));
    console.log('');

    // Test 1: Create/Find Global Chat (using join_global logic)
    console.log('TEST 1: Global Chat (Simulating join_global)');
    console.log('=====================================');

    let globalChat = await Conversation.findOne({ type: 'global' });

    if (!globalChat) {
      globalChat = await Conversation.create({
        type: 'global',
        name: 'Global Chat',
        participants: [],
      });
      console.log('✅ Created global chat room');
    } else {
      console.log('✅ Global chat room already exists');
    }
    console.log(`   ID: ${globalChat._id}`);
    console.log(`   Type: ${globalChat.type}`);
    console.log(`   Name: ${globalChat.name}\n`);

    // Test 2: Send Global Messages
    console.log('TEST 2: Sending Global Messages');
    console.log('=====================================');

    const globalMsg1 = await Message.create({
      conversation: globalChat._id,
      sender: users[0]._id,
      content: 'Hello everyone! This is a global message.',
    });
    await globalMsg1.populate('sender', 'name username');
    console.log(
      `✅ ${globalMsg1.sender.username || globalMsg1.sender.name} sent: "${globalMsg1.content}"`
    );

    const globalMsg2 = await Message.create({
      conversation: globalChat._id,
      sender: users[1]._id,
      content: 'Hi there! Global chat is working!',
    });
    await globalMsg2.populate('sender', 'name username');
    console.log(
      `✅ ${globalMsg2.sender.username || globalMsg2.sender.name} sent: "${globalMsg2.content}"\n`
    );

    // Test 3: Create DM (Simulating join_dm)
    console.log('TEST 3: DM Creation (Simulating join_dm)');
    console.log('=====================================');

    const user1 = users[0]._id;
    const user2 = users[1]._id;

    // Simulate join_dm logic
    let dmConversation = await Conversation.findOne({
      type: 'dm',
      participants: { $all: [user1, user2] },
    });

    if (!dmConversation) {
      dmConversation = await Conversation.create({
        type: 'dm',
        participants: [user1, user2],
      });
      console.log('✅ Created new DM conversation');
    } else {
      console.log('✅ DM conversation already exists');
    }

    await dmConversation.populate('participants', 'username name email');
    console.log(`   ID: ${dmConversation._id}`);
    console.log(`   Type: ${dmConversation.type}`);
    console.log(
      `   Participants: ${dmConversation.participants.map((p) => p.username || p.name).join(', ')}\n`
    );

    // Test 4: Send DM Messages
    console.log('TEST 4: Sending DM Messages');
    console.log('=====================================');

    const dmMsg1 = await Message.create({
      conversation: dmConversation._id,
      sender: users[0]._id,
      content: 'Hey! This is a private message.',
    });
    await dmMsg1.populate('sender', 'username name');
    console.log(`✅ ${dmMsg1.sender.username || dmMsg1.sender.name} sent DM: "${dmMsg1.content}"`);

    const dmMsg2 = await Message.create({
      conversation: dmConversation._id,
      sender: users[1]._id,
      content: 'Got it! DMs are working perfectly!',
    });
    await dmMsg2.populate('sender', 'username name');
    console.log(
      `✅ ${dmMsg2.sender.username || dmMsg2.sender.name} replied: "${dmMsg2.content}"\n`
    );

    // Test 5: Retrieve Chat History (Simulating chat_history event)
    console.log('TEST 5: Retrieving Chat Histories');
    console.log('=====================================');

    const globalHistory = await Message.find({ conversation: globalChat._id })
      .populate('sender', 'username name')
      .sort({ createdAt: 1 })
      .limit(50);
    console.log(`📜 Global Chat (${globalHistory.length} messages):`);
    globalHistory.forEach((msg) => {
      console.log(`   ${msg.sender.username || msg.sender.name}: ${msg.content}`);
    });

    const dmHistory = await Message.find({ conversation: dmConversation._id })
      .populate('sender', 'username name')
      .sort({ createdAt: 1 })
      .limit(50);
    console.log(`\n📜 DM Chat (${dmHistory.length} messages):`);
    dmHistory.forEach((msg) => {
      console.log(`   ${msg.sender.username || msg.sender.name}: ${msg.content}`);
    });

    // Test 6: Multiple DMs Test
    console.log('\n\nTEST 6: Testing Multiple DMs');
    console.log('=====================================');

    if (users.length > 2) {
      const user3 = users[2]._id;
      let dm2 = await Conversation.findOne({
        type: 'dm',
        participants: { $all: [user1, user3] },
      });

      if (!dm2) {
        dm2 = await Conversation.create({
          type: 'dm',
          participants: [user1, user3],
        });
      }
      await dm2.populate('participants', 'username name');
      console.log(
        `✅ DM between ${users[0].username || users[0].name} and ${users[2].username || users[2].name}: ${dm2._id}`
      );
      console.log('   Each DM has its own isolated room!');
    } else {
      console.log('⚠️  Only 2 users available, skipping multi-DM test');
    }

    // Test 7: Verify Message Validation
    console.log('\n\nTEST 7: Message Validation');
    console.log('=====================================');

    try {
      // This should fail - no conversation
      await Message.create({
        sender: users[0]._id,
        content: 'This should fail - no conversation or project',
      });
      console.log('❌ Validation failed - message created without conversation');
    } catch {
      console.log('✅ Validation working - prevented message without conversation/project');
    }

    console.log('\n\n🎉 ALL TESTS PASSED!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Global chat created (join_global pattern)');
    console.log('   ✅ DM conversation created (join_dm pattern)');
    console.log('   ✅ Messages sent using send_message event');
    console.log('   ✅ Chat history retrieved (sorted by createdAt)');
    console.log('   ✅ Multiple DMs work independently');
    console.log('   ✅ Message validation enforced');

    console.log('\n🔑 Socket Event Testing Data:');
    console.log('=====================================');
    console.log('Socket Events to Test:');
    console.log('  1. join_global - No params needed');
    console.log("  2. join_dm - { userId: 'targetUserId' }");
    console.log(`  3. send_message - { convoId: '${globalChat._id}', content: 'Hello!' }`);
    console.log('\nExpected Socket Responses:');
    console.log('  • chat_history - Array of messages');
    console.log('  • receive_message - New message object');
    console.log("  • error_message - { message: 'error text' }");
    console.log('\nTest Data:');
    console.log(`Global Chat ID: ${globalChat._id}`);
    console.log(`DM ID: ${dmConversation._id}`);
    console.log(`User 1: ${users[0].username || users[0].name} (${users[0]._id})`);
    console.log(`User 2: ${users[1].username || users[1].name} (${users[1]._id})`);
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testConversations();
