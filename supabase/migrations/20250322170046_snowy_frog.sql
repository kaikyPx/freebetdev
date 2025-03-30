/*
  # Update betting houses order

  1. Changes
    - Delete existing betting houses
    - Insert betting houses in the specified order
    - Add new status option
*/

-- Delete existing betting houses
DELETE FROM betting_houses;

-- Insert betting houses in the new order
INSERT INTO betting_houses (name)
VALUES
  ('Vaidebet'),
  ('Betpix365'),
  ('MC Games'),
  ('BET365'),
  ('Betano'),
  ('Superbet'),
  ('KTO'),
  ('Novibet'),
  ('EsportivaBet'),
  ('Lotogreen'),
  ('EstrelaBet'),
  ('BR4'),
  ('BateuBet'),
  ('Betnacional');