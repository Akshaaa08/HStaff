import { db } from '../../config/db';
import { conflict, notFound } from '../../utils/errors';

export interface SkillRow {
  id: number;
  name: string;
  active: boolean;
}

export const listActiveSkills = () =>
  db('skills').where({ active: true }).orderBy('name').select<SkillRow[]>('id', 'name', 'active');
export const listAllSkills = () => db('skills').orderBy('name').select<SkillRow[]>('id', 'name', 'active');

export async function createSkill(name: string): Promise<SkillRow> {
  try {
    const [row] = await db('skills').insert({ name, active: true }).returning<SkillRow[]>('*');
    return row;
  } catch (err) {
    if ((err as { code?: string }).code === '23505')
      throw conflict('SKILL_EXISTS', 'A skill with this name already exists');
    throw err;
  }
}

export async function updateSkill(id: number, patch: { name?: string; active?: boolean }): Promise<SkillRow> {
  try {
    const [row] = await db('skills').where({ id }).update(patch).returning<SkillRow[]>('*');
    if (!row) throw notFound('Skill not found');
    return row;
  } catch (err) {
    if ((err as { code?: string }).code === '23505')
      throw conflict('SKILL_EXISTS', 'A skill with this name already exists');
    throw err;
  }
}

/** Hard-deletes an unused skill; a skill already in use is deactivated instead so history stays intact. */
export async function deleteSkill(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
  const skill = await db('skills').where({ id }).first<SkillRow | undefined>();
  if (!skill) throw notFound('Skill not found');
  const [{ n }] = await db
    .raw<{ rows: { n: number }[] }>(
      `SELECT (SELECT count(*) FROM worker_skills WHERE skill_id = ?) + (SELECT count(*) FROM shifts WHERE skill_id = ?) AS n`,
      [id, id],
    )
    .then((r) => r.rows.map((x) => ({ n: Number(x.n) })));
  if (n > 0) {
    await db('skills').where({ id }).update({ active: false });
    return { deleted: false, deactivated: true };
  }
  await db('skills').where({ id }).del();
  return { deleted: true, deactivated: false };
}
