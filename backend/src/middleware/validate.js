/**
 * Zod validation middleware.
 *
 *   validate({ body: schema, params: schema, query: schema })
 *
 * Replaces the validated source with the parsed (coerced) data so handlers
 * can trust types downstream. Validation failures surface as 400 with
 * { code: 'VALIDATION', details: [...] }.
 */

const { BadRequest } = require('../lib/errors');

function validate(schemas) {
  return function (req, _res, next) {
    try {
      for (const key of ['body', 'params', 'query']) {
        const schema = schemas[key];
        if (!schema) continue;
        const result = schema.safeParse(req[key]);
        if (!result.success) {
          const details = result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          }));
          throw new BadRequest('Validation failed', { code: 'VALIDATION', details });
        }
        req[key] = result.data;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = validate;
