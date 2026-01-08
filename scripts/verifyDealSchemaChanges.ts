#!/usr/bin/env tsx
/**
 * Verification script for deal schema changes
 * Tests: image_url NOT NULL, new boolean columns, nullable date/time fields
 */

import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function verifyDealSchemaChanges() {
  console.log("🔍 Starting deal schema verification...\n");

  try {
    // Test A: Check column existence and types
    console.log("📋 Test A: Column Existence & Types");
    console.log("=" .repeat(60));
    const columnInfo = await db.execute(sql`
      select column_name, is_nullable, data_type, udt_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'deals'
        and column_name in (
          'image_url',
          'available_during_business_hours',
          'is_ongoing',
          'end_date',
          'start_time',
          'end_time'
        )
      order by column_name;
    `);
    
    console.table(columnInfo.rows);

    // Test B: Verify image_url is NOT NULL
    console.log("\n🖼️  Test B: Image URL NOT NULL Constraint");
    console.log("=" .repeat(60));
    const imageUrlInfo = await db.execute(sql`
      select column_name, is_nullable, column_default
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'deals'
        and column_name = 'image_url';
    `);
    
    const isImageNullable = imageUrlInfo.rows[0]?.is_nullable === 'YES';
    console.log(`Image URL is_nullable: ${imageUrlInfo.rows[0]?.is_nullable}`);
    
    if (isImageNullable) {
      console.log("❌ FAIL: image_url should be NOT NULL!");
    } else {
      console.log("✅ PASS: image_url is correctly NOT NULL");
    }

    // Test C: Verify date/time fields are nullable
    console.log("\n📅 Test C: Date/Time Nullability");
    console.log("=" .repeat(60));
    const dateTimeInfo = await db.execute(sql`
      select column_name, is_nullable
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'deals'
        and column_name in ('end_date','start_time','end_time')
      order by column_name;
    `);
    
    console.table(dateTimeInfo.rows);
    
    const allNullable = dateTimeInfo.rows.every((row: any) => row.is_nullable === 'YES');
    if (allNullable) {
      console.log("✅ PASS: All date/time fields are correctly nullable");
    } else {
      console.log("❌ FAIL: Some date/time fields are still NOT NULL!");
    }

    // Test D: Check for existing rows with NULL image_url (data integrity)
    console.log("\n🔎 Test D: Data Integrity Check");
    console.log("=" .repeat(60));
    const nullImageCount = await db.execute(sql`
      select count(*) as missing_image
      from deals
      where image_url is null;
    `);
    
    const missingImageCount = Number(nullImageCount.rows[0]?.missing_image || 0);
    console.log(`Rows with NULL image_url: ${missingImageCount}`);
    
    if (missingImageCount > 0) {
      console.log("⚠️  WARNING: Found rows with NULL image_url! These will cause INSERT failures.");
      
      // Show the problematic rows
      const problematicRows = await db.execute(sql`
        select id, title, created_at
        from deals
        where image_url is null
        limit 5;
      `);
      console.table(problematicRows.rows);
    } else {
      console.log("✅ PASS: No rows with NULL image_url");
    }

    // Test E: Show recent deals to verify new columns are populated correctly
    console.log("\n📊 Test E: Recent Deals Sample (Last 10)");
    console.log("=" .repeat(60));
    const recentDeals = await db.execute(sql`
      select 
        id, 
        title, 
        image_url is not null as has_image,
        available_during_business_hours,
        start_time,
        end_time,
        is_ongoing,
        end_date,
        created_at
      from deals
      order by created_at desc
      limit 10;
    `);
    
    if (recentDeals.rows.length > 0) {
      console.table(recentDeals.rows);
    } else {
      console.log("ℹ️  No deals found in database");
    }

    // Test F: Boolean columns default values
    console.log("\n⚙️  Test F: Boolean Column Defaults");
    console.log("=" .repeat(60));
    const booleanDefaults = await db.execute(sql`
      select 
        column_name, 
        column_default,
        is_nullable
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'deals'
        and column_name in ('available_during_business_hours', 'is_ongoing')
      order by column_name;
    `);
    
    console.table(booleanDefaults.rows);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Schema verification complete!");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run verification
verifyDealSchemaChanges();
