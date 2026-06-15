const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@system.com';
  const newPassword = 'NewSecurePassword123!'; // USER: Change this to your desired password
  
  const hashed = await bcrypt.hash(newPassword, 12);
  
  const user = await prisma.user.update({
    where: { email: email },
    data: { password: hashed }
  });
  
  console.log(`Password updated for: ${user.email}`);
  console.log(`New password set to: ${newPassword}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
