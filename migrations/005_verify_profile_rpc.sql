-- Atomische profile-verificatie: status-update + audit-event in één
-- transactie zodat een audit nooit kan ontbreken na een statuswijziging.
BEGIN;

CREATE OR REPLACE FUNCTION verify_profile_atomic(
  p_profile_id uuid,
  p_to_status text,
  p_reason text,
  p_actor_admin_id uuid
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_from_status text;
  v_is_approved boolean := (p_to_status = 'APPROVED');
BEGIN
  SELECT verification_status INTO v_from_status
    FROM profile WHERE id = p_profile_id FOR UPDATE;
  IF v_from_status IS NULL THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE profile SET
    verification_status = p_to_status,
    is_verified = v_is_approved,
    is_public = v_is_approved,
    updated_at = now()
  WHERE id = p_profile_id;

  INSERT INTO practitioner_verification_event
    (profile_id, from_status, to_status, reason, actor_admin_id)
  VALUES
    (p_profile_id, v_from_status, p_to_status, p_reason, p_actor_admin_id);

  RETURN jsonb_build_object(
    'success', true,
    'fromStatus', v_from_status,
    'toStatus', p_to_status
  );
END $$;

COMMIT;
