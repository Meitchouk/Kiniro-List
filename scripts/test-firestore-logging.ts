/**
 * Script de diagnóstico para probar el logging a Firestore
 * Ejecutar con: npx tsx scripts/test-firestore-logging.ts
 */

import * as fs from "fs";
import * as path from "path";

// Load .env.local manually
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, "");
      process.env[key.trim()] = cleanValue;
    }
  });
}

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const LOGS_COLLECTION = "system_logs";

async function testFirestoreLogging() {
  console.log("=== Diagnóstico de Firestore Logging ===\n");

  // 1. Verificar variables de entorno
  console.log("1. Verificando variables de entorno...");
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  console.log(`   FIREBASE_ADMIN_PROJECT_ID: ${projectId ? "✓ Configurado" : "✗ FALTA"}`);
  console.log(`   FIREBASE_ADMIN_CLIENT_EMAIL: ${clientEmail ? "✓ Configurado" : "✗ FALTA"}`);
  console.log(
    `   FIREBASE_ADMIN_PRIVATE_KEY: ${privateKey ? `✓ Configurado (${privateKey.length} chars)` : "✗ FALTA"}`
  );

  if (!projectId || !clientEmail || !privateKey) {
    console.error("\n❌ Faltan variables de entorno. Verifica tu archivo .env.local");
    process.exit(1);
  }

  // 2. Inicializar Firebase Admin
  console.log("\n2. Inicializando Firebase Admin...");
  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    console.log("   ✓ Firebase Admin inicializado correctamente");
  } catch (error) {
    console.error("   ✗ Error al inicializar Firebase Admin:", error);
    process.exit(1);
  }

  // 3. Obtener instancia de Firestore
  console.log("\n3. Obteniendo instancia de Firestore...");
  const db = getFirestore();
  console.log("   ✓ Instancia de Firestore obtenida");

  // 4. Intentar escribir un log de prueba
  console.log("\n4. Escribiendo log de prueba...");
  const testEntry = {
    timestamp: new Date().toISOString(),
    level: "info",
    source: "server",
    message: "Test log from diagnostic script",
    context: "diagnostic:test",
    metadata: {
      test: true,
      scriptRun: new Date().toISOString(),
    },
    createdAt: new Date(),
  };

  try {
    const docRef = await db.collection(LOGS_COLLECTION).add(testEntry);
    console.log(`   ✓ Log escrito exitosamente con ID: ${docRef.id}`);
  } catch (error) {
    console.error("   ✗ Error al escribir log:", error);
    process.exit(1);
  }

  // 5. Verificar que el log se puede leer
  console.log("\n5. Leyendo logs recientes...");
  try {
    const snapshot = await db
      .collection(LOGS_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    console.log(`   ✓ Encontrados ${snapshot.size} logs en la colección "${LOGS_COLLECTION}"`);

    if (snapshot.size > 0) {
      console.log("\n   Últimos logs:");
      snapshot.docs.forEach((doc, i) => {
        const data = doc.data();
        const time = data.createdAt?.toDate?.()?.toLocaleTimeString() || "N/A";
        console.log(`   ${i + 1}. [${data.level}] ${time} - ${data.message} (${data.context})`);
      });
    }
  } catch (error) {
    console.error("   ✗ Error al leer logs:", error);
    process.exit(1);
  }

  console.log("\n=== ✓ Diagnóstico completado exitosamente ===");
  console.log(`\nLa colección "${LOGS_COLLECTION}" debería ser visible en Firebase Console:`);
  console.log(`https://console.firebase.google.com/project/${projectId}/firestore`);
}

testFirestoreLogging().catch(console.error);
