import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1768522846429 implements MigrationInterface {
    name = 'InitialMigration1768522846429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "terms_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "versionNumber" character varying NOT NULL, "content" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_517b2bd5d583e4eb10618494199" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "terms_acceptance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "versionId" uuid NOT NULL, "acceptedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_23370d00ad2d55a97e1237f4594" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "terms_acceptance" ADD CONSTRAINT "FK_16096804401ba88dfb56036836c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "terms_acceptance" ADD CONSTRAINT "FK_16817cf8aa3f7080c390442bc43" FOREIGN KEY ("versionId") REFERENCES "terms_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "terms_acceptance" DROP CONSTRAINT "FK_16817cf8aa3f7080c390442bc43"`);
        await queryRunner.query(`ALTER TABLE "terms_acceptance" DROP CONSTRAINT "FK_16096804401ba88dfb56036836c"`);
        await queryRunner.query(`DROP TABLE "terms_acceptance"`);
        await queryRunner.query(`DROP TABLE "terms_version"`);
    }

}
