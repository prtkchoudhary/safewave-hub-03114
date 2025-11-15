// Paste this in browser console (F12) to debug chat function

console.log('🔍 SafeGuard Chat Debug Tool');
console.log('============================');

// Configuration
const config = {
  supabaseUrl: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
  functionName: 'gemini-safety-chat'
};

console.log('Config:', config);

// Test 1: Check if Supabase is reachable
async function test1_SupabaseConnection() {
  console.log('\n📡 Test 1: Checking Supabase connection...');
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
      headers: { 'apikey': config.anonKey }
    });
    console.log('✅ Supabase is reachable', response.status);
    return true;
  } catch (error) {
    console.error('❌ Cannot reach Supabase:', error);
    return false;
  }
}

// Test 2: Check if edge function exists
async function test2_FunctionExists() {
  console.log('\n🔍 Test 2: Checking if edge function is deployed...');
  try {
    const response = await fetch(`${config.supabaseUrl}/functions/v1/${config.functionName}`, {
      method: 'OPTIONS',
      headers: { 'apikey': config.anonKey }
    });
    console.log('Response status:', response.status);
    if (response.status === 404) {
      console.error('❌ Function NOT deployed!');
      console.log('📝 Deploy it at: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions');
      return false;
    }
    console.log('✅ Function exists');
    return true;
  } catch (error) {
    console.error('❌ Error checking function:', error);
    return false;
  }
}

// Test 3: Try calling the function
async function test3_CallFunction() {
  console.log('\n🚀 Test 3: Calling edge function...');
  try {
    const response = await fetch(`${config.supabaseUrl}/functions/v1/${config.functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.anonKey}`,
        'apikey': config.anonKey
      },
      body: JSON.stringify({
        message: 'test message',
        conversation_history: [],
        emergency_context: {
          location: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      console.log('✅ Function works!');
      console.log('AI Response:', data.response);
      return true;
    } else {
      console.error('❌ Function returned error');
      if (data.error === 'Gemini API key not configured') {
        console.log('📝 Add GEMINI_API_KEY secret at:');
        console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions');
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Error calling function:', error);
    return false;
  }
}

// Test 4: Check localStorage for auth
async function test4_CheckAuth() {
  console.log('\n🔐 Test 4: Checking authentication...');
  const supabaseAuth = localStorage.getItem('sb-YOUR_PROJECT_ID-auth-token');
  if (supabaseAuth) {
    console.log('✅ User is authenticated');
    const authData = JSON.parse(supabaseAuth);
    console.log('User:', authData);
  } else {
    console.log('⚠️  No authentication found (this is OK for testing)');
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🏁 Running all diagnostic tests...\n');
  
  await test1_SupabaseConnection();
  await test2_FunctionExists();
  await test3_CallFunction();
  await test4_CheckAuth();
  
  console.log('\n✅ Diagnostic complete!');
  console.log('\nIf function failed:');
  console.log('1. Deploy function: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions');
  console.log('2. Add GEMINI_API_KEY secret: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions');
  console.log('3. Hard refresh browser (Ctrl+Shift+R)');
}

// Auto-run
runAllTests();
