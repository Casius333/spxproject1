import bcrypt from 'bcryptjs';
import { db } from '../db/index.ts';
import { adminUsers } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12;

async function migrateAdminPasswords() {
  try {
    console.log('Starting admin password migration to bcrypt...');
    
    // Get all admin users
    const allAdmins = await db.select().from(adminUsers);
    
    console.log(`Found ${allAdmins.length} admin users to migrate`);
    
    for (const admin of allAdmins) {
      // Check if password is already bcrypt hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (admin.password && admin.password.match(/^\$2[ayb]\$/)) {
        console.log(`Admin ${admin.username} already has bcrypt password, skipping`);
        continue;
      }
      
      // For the default admin, we know the original password was "admin123"
      // For others, we'll need to reset to a secure default
      let newPassword;
      if (admin.username === 'admin' && admin.email === 'admin@luckypunt.com') {
        newPassword = 'admin123'; // Keep original password
      } else {
        newPassword = 'TempPassword123!'; // Temporary password for other admins
        console.log(`Admin ${admin.username} will get temporary password: TempPassword123!`);
      }
      
      // Hash the password with bcrypt
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      
      // Update the admin user
      await db.update(adminUsers)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(adminUsers.id, admin.id));
      
      console.log(`Updated password for admin: ${admin.username}`);
    }
    
    console.log('Admin password migration completed successfully!');
    console.log('All admin users now use secure bcrypt password hashing.');
    
  } catch (error) {
    console.error('Error migrating admin passwords:', error);
    process.exit(1);
  }
}

// Run the migration
migrateAdminPasswords()
  .then(() => {
    console.log('Migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });