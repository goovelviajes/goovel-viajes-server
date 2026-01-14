import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1768362399669 implements MigrationInterface {
    name = 'InitialMigration1768362399669'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."journey_request_type_enum" AS ENUM('carpool', 'package')`);
        await queryRunner.query(`CREATE TYPE "public"."journey_request_status_enum" AS ENUM('pending', 'matched', 'cancelled', 'closed', 'offered')`);
        await queryRunner.query(`CREATE TABLE "journey_request" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "origin" jsonb NOT NULL, "destination" jsonb NOT NULL, "requested_time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "requested_seats" integer DEFAULT '1', "proposed_price" numeric(10,2), "type" "public"."journey_request_type_enum" NOT NULL, "status" "public"."journey_request_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "package_weight" numeric, "package_length" numeric, "package_width" numeric, "package_height" numeric, "package_description" character varying, "userId" uuid, CONSTRAINT "PK_193c4050ab9edd2dc7e20f93b86" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."booking_status_enum" AS ENUM('pending', 'cancelled', 'completed', 'confirmed')`);
        await queryRunner.query(`CREATE TABLE "booking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seatCount" integer, "status" "public"."booking_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "isShipping" boolean NOT NULL, "userId" uuid, "journeyId" uuid, CONSTRAINT "PK_49171efc69702ed84c812f33540" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rating" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" integer NOT NULL, "comment" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "journeyId" uuid, "raterUserId" uuid, "ratedUserId" uuid, CONSTRAINT "PK_ecda8ad32645327e4765b43649e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "senderId" uuid, "receiverId" uuid, "journeyId" uuid, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_feccfd7c9518c19bd1de9d5bc6" ON "message" ("journeyId", "senderId", "receiverId") `);
        await queryRunner.query(`CREATE TYPE "public"."journey_type_enum" AS ENUM('carpool', 'package')`);
        await queryRunner.query(`CREATE TYPE "public"."journey_status_enum" AS ENUM('pending', 'cancelled', 'completed')`);
        await queryRunner.query(`CREATE TABLE "journey" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "origin" jsonb NOT NULL, "destination" jsonb NOT NULL, "departure_time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "available_seats" integer, "price_per_seat" numeric(10,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "type" "public"."journey_type_enum" NOT NULL, "status" "public"."journey_status_enum" NOT NULL DEFAULT 'pending', "userId" uuid, "vehicleId" uuid, "accepted_proposal_id" uuid, CONSTRAINT "REL_82bc472a0d3330e517d8489870" UNIQUE ("accepted_proposal_id"), CONSTRAINT "PK_0dfc23b6e61590ef493cf3adcde" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."proposal_status_enum" AS ENUM('SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "proposal" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."proposal_status_enum" NOT NULL DEFAULT 'SENT', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "priceOffered" numeric(10,2) NOT NULL, "journey_request_id" uuid, "vehicle_id" uuid, "driver_id" uuid, CONSTRAINT "PK_ca872ecfe4fef5720d2d39e4275" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "message" character varying NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying NOT NULL, "user_id" uuid, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profile_name" character varying NOT NULL, "phone" character varying, "image" character varying, "address" character varying, "city" character varying, "country" character varying, "province" character varying, "user_id" uuid, CONSTRAINT "UQ_2302e849c5abe24a848862c1ebf" UNIQUE ("profile_name"), CONSTRAINT "REL_d752442f45f258a8bdefeebb2f" UNIQUE ("user_id"), CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."report_reason_enum" AS ENUM('spam', 'fraud', 'inappropriate_behavior', 'no_show', 'dangerous_driving', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."report_status_enum" AS ENUM('pending', 'review', 'resolved', 'dismissed')`);
        await queryRunner.query(`CREATE TABLE "report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reason" "public"."report_reason_enum" NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."report_status_enum" NOT NULL DEFAULT 'pending', "adminNotes" text, "reporter_id" uuid, "reported_id" uuid, CONSTRAINT "PK_99e4d0bea58cba73c57f935a546" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "lastname" character varying, "email" character varying NOT NULL, "password" character varying, "birthdate" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "role" character varying NOT NULL DEFAULT 'member', "isEmailConfirmed" boolean NOT NULL DEFAULT false, "resetToken" character varying, "failedAttempts" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP WITH TIME ZONE, "isVerifiedUser" boolean NOT NULL DEFAULT false, "isBanned" boolean NOT NULL DEFAULT false, "banReason" text, "bannedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."vehicle_type_enum" AS ENUM('car', 'utility', 'van', 'motorcycle', 'bus')`);
        await queryRunner.query(`CREATE TABLE "vehicle" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "brand" character varying NOT NULL, "model" character varying NOT NULL, "capacity" integer NOT NULL, "color" character varying NOT NULL, "plate" character varying NOT NULL, "type" "public"."vehicle_type_enum" NOT NULL, "year" integer NOT NULL, "userId" uuid, CONSTRAINT "UQ_51922d0c6647cb10de3f76ba4e3" UNIQUE ("plate"), CONSTRAINT "PK_187fa17ba39d367e5604b3d1ec9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "journey_request" ADD CONSTRAINT "FK_18f07546f3f0276644daf184602" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking" ADD CONSTRAINT "FK_336b3f4a235460dc93645fbf222" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking" ADD CONSTRAINT "FK_324a1b9572a6035672aac003c64" FOREIGN KEY ("journeyId") REFERENCES "journey"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rating" ADD CONSTRAINT "FK_3b76fbd04c99948372b489d6692" FOREIGN KEY ("journeyId") REFERENCES "journey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rating" ADD CONSTRAINT "FK_67c8f7d4ce20dfc710f165eac4f" FOREIGN KEY ("raterUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rating" ADD CONSTRAINT "FK_5451db69d0f53e4104f1c27889a" FOREIGN KEY ("ratedUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_71fb36906595c602056d936fc13" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_479ef203a3dfc807df17a405e15" FOREIGN KEY ("journeyId") REFERENCES "journey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journey" ADD CONSTRAINT "FK_a0580c832d9334a3b84b5d4ccf3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journey" ADD CONSTRAINT "FK_5a79342a89f120522c5d16949a8" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journey" ADD CONSTRAINT "FK_82bc472a0d3330e517d84898703" FOREIGN KEY ("accepted_proposal_id") REFERENCES "proposal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "proposal" ADD CONSTRAINT "FK_86e023297a60dd2647e92514cc8" FOREIGN KEY ("journey_request_id") REFERENCES "journey_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "proposal" ADD CONSTRAINT "FK_16dd0f677e9b9ddd31f1f46e922" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "proposal" ADD CONSTRAINT "FK_91bfe9dc282ebbf972628af23c4" FOREIGN KEY ("driver_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "report" ADD CONSTRAINT "FK_d41df66b60944992386ed47cf2e" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "report" ADD CONSTRAINT "FK_53f415b3a20d08d73f403da2d8e" FOREIGN KEY ("reported_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicle" ADD CONSTRAINT "FK_86aea53f0b2b4f046e25e8315d1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle" DROP CONSTRAINT "FK_86aea53f0b2b4f046e25e8315d1"`);
        await queryRunner.query(`ALTER TABLE "report" DROP CONSTRAINT "FK_53f415b3a20d08d73f403da2d8e"`);
        await queryRunner.query(`ALTER TABLE "report" DROP CONSTRAINT "FK_d41df66b60944992386ed47cf2e"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8"`);
        await queryRunner.query(`ALTER TABLE "proposal" DROP CONSTRAINT "FK_91bfe9dc282ebbf972628af23c4"`);
        await queryRunner.query(`ALTER TABLE "proposal" DROP CONSTRAINT "FK_16dd0f677e9b9ddd31f1f46e922"`);
        await queryRunner.query(`ALTER TABLE "proposal" DROP CONSTRAINT "FK_86e023297a60dd2647e92514cc8"`);
        await queryRunner.query(`ALTER TABLE "journey" DROP CONSTRAINT "FK_82bc472a0d3330e517d84898703"`);
        await queryRunner.query(`ALTER TABLE "journey" DROP CONSTRAINT "FK_5a79342a89f120522c5d16949a8"`);
        await queryRunner.query(`ALTER TABLE "journey" DROP CONSTRAINT "FK_a0580c832d9334a3b84b5d4ccf3"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_479ef203a3dfc807df17a405e15"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_71fb36906595c602056d936fc13"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`);
        await queryRunner.query(`ALTER TABLE "rating" DROP CONSTRAINT "FK_5451db69d0f53e4104f1c27889a"`);
        await queryRunner.query(`ALTER TABLE "rating" DROP CONSTRAINT "FK_67c8f7d4ce20dfc710f165eac4f"`);
        await queryRunner.query(`ALTER TABLE "rating" DROP CONSTRAINT "FK_3b76fbd04c99948372b489d6692"`);
        await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_324a1b9572a6035672aac003c64"`);
        await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_336b3f4a235460dc93645fbf222"`);
        await queryRunner.query(`ALTER TABLE "journey_request" DROP CONSTRAINT "FK_18f07546f3f0276644daf184602"`);
        await queryRunner.query(`DROP TABLE "vehicle"`);
        await queryRunner.query(`DROP TYPE "public"."vehicle_type_enum"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "report"`);
        await queryRunner.query(`DROP TYPE "public"."report_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."report_reason_enum"`);
        await queryRunner.query(`DROP TABLE "profile"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TABLE "proposal"`);
        await queryRunner.query(`DROP TYPE "public"."proposal_status_enum"`);
        await queryRunner.query(`DROP TABLE "journey"`);
        await queryRunner.query(`DROP TYPE "public"."journey_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."journey_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_feccfd7c9518c19bd1de9d5bc6"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP TABLE "rating"`);
        await queryRunner.query(`DROP TABLE "booking"`);
        await queryRunner.query(`DROP TYPE "public"."booking_status_enum"`);
        await queryRunner.query(`DROP TABLE "journey_request"`);
        await queryRunner.query(`DROP TYPE "public"."journey_request_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."journey_request_type_enum"`);
    }

}
