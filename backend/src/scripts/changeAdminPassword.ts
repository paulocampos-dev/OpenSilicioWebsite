import bcrypt from 'bcrypt';
import pool from '../config/database';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('- A senha deve ter pelo menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('- Deve conter pelo menos uma letra maiúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('- Deve conter pelo menos uma letra minúscula');
  }

  if (!/\d/.test(password)) {
    errors.push('- Deve conter pelo menos um número');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('- Deve conter pelo menos um caractere especial (@$!%*?&)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function changeAdminPassword() {
  try {
    console.log('========================================');
    console.log('  OpenSilicio - Alteração de Senha Admin');
    console.log('========================================\n');

    // Prompt for username
    const username = await question('Nome de usuário (padrão: AdmOpen): ');
    const targetUsername = username.trim() || 'AdmOpen';

    // Verify user exists
    const userResult = await pool.query(
      'SELECT id, username FROM users WHERE username = $1',
      [targetUsername]
    );

    if (userResult.rows.length === 0) {
      console.error(`\n❌ Usuário "${targetUsername}" não encontrado!`);
      rl.close();
      process.exit(1);
    }

    const user = userResult.rows[0];

    // Prompt for new password (hidden input not directly supported, show warning)
    console.log('\n⚠️  AVISO: A senha será visível ao digitar (limitação do terminal)');
    console.log('Certifique-se de que ninguém está observando sua tela.\n');

    const newPassword = await question('Nova senha: ');

    if (!newPassword.trim()) {
      console.error('\n❌ A senha não pode ser vazia!');
      rl.close();
      process.exit(1);
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      console.error('\n❌ Senha não atende aos requisitos de segurança:');
      validation.errors.forEach((error) => console.error(error));
      rl.close();
      process.exit(1);
    }

    // Confirm password
    const confirmPassword = await question('Confirme a nova senha: ');

    if (newPassword !== confirmPassword) {
      console.error('\n❌ As senhas não coincidem!');
      rl.close();
      process.exit(1);
    }

    // Final confirmation
    const confirm = await question(`\nAlterar senha do usuário "${user.username}"? (s/N): `);
    
    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'sim') {
      console.log('\n⚠️  Operação cancelada.');
      rl.close();
      process.exit(0);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, user.id]
    );

    console.log('\n✅ Senha alterada com sucesso!');
    console.log(`   Usuário: ${user.username}`);
    console.log('\n⚠️  Lembre-se de guardar a nova senha em local seguro!');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao alterar senha:', error);
    rl.close();
    process.exit(1);
  }
}

changeAdminPassword();

