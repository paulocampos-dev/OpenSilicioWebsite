import bcrypt from 'bcrypt';
import pool from '../config/database';

async function seedAdmin() {
  try {
    const username = 'AdmOpen';
    const password = 'ADMOpenSilicio123!@2025';
    
    // Gerar hash da senha
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Inserir ou atualizar usuário
    await pool.query(
      `INSERT INTO users (username, password_hash) 
       VALUES ($1, $2)
       ON CONFLICT (username) 
       DO UPDATE SET password_hash = $2`,
      [username, passwordHash]
    );
    
    console.log('✅ Usuário administrador criado/atualizado com sucesso!');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error);
    process.exit(1);
  }
}

seedAdmin();

