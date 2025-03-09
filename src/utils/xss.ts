import xss from 'xss';

export const sanitizeInput = (input: string): string => {
  return xss(input);
};