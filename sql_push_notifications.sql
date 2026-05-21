-- Soumi Crochet push notifications server-side fix
-- Run this once in Supabase SQL Editor after your main schema.sql.
-- It does not drop tables and it keeps existing data.

create extension if not exists pg_net with schema extensions;

-- Make key tables part of realtime publication when available.
do $$
begin
  begin alter publication supabase_realtime add table public.orders; exception when others then null; end;
  begin alter publication supabase_realtime add table public.reviews; exception when others then null; end;
  begin alter publication supabase_realtime add table public.analytics; exception when others then null; end;
  begin alter publication supabase_realtime add table public.subscribers; exception when others then null; end;
  begin alter publication supabase_realtime add table public.notification_logs; exception when others then null; end;
end $$;

create or replace function public.send_onesignal_push(
  p_title text,
  p_message text,
  p_subscription_ids text[] default null,
  p_url text default 'https://soumicrochet.store/',
  p_button_text text default 'اطلب الآن',
  p_app_id text default 'b0ca17c7-75cb-49bb-bfbd-936677a81519'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  v_payload jsonb;
  v_request_id bigint;
begin
  v_payload := jsonb_build_object(
    'app_id', p_app_id,
    'headings', jsonb_build_object('en', p_title, 'fr', p_title, 'ar', p_title),
    'contents', jsonb_build_object('en', p_message, 'fr', p_message, 'ar', p_message),
    'url', coalesce(p_url, 'https://soumicrochet.store/'),
    'web_url', coalesce(p_url, 'https://soumicrochet.store/'),
    'web_buttons', jsonb_build_array(jsonb_build_object('id', 'order-btn', 'text', coalesce(p_button_text, 'اطلب الآن'), 'url', coalesce(p_url, 'https://soumicrochet.store/'))),
    'buttons', jsonb_build_array(jsonb_build_object('id', 'order-btn', 'text', coalesce(p_button_text, 'اطلب الآن'))),
    'chrome_web_icon', 'https://soumicrochet.store/assets/img/logo.png',
    'firefox_icon', 'https://soumicrochet.store/assets/img/logo.png',
    'isAnyWeb', true
  );

  if p_subscription_ids is not null and array_length(p_subscription_ids, 1) > 0 then
    v_payload := v_payload || jsonb_build_object('include_subscription_ids', to_jsonb(p_subscription_ids));
  else
    v_payload := v_payload || jsonb_build_object('included_segments', jsonb_build_array('All'));
  end if;

  select net.http_post(
    url := 'https://onesignal.com/api/v1/notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Basic os_v2_app_mvsrfcqu7zdmhpuhorop3efsmrqpwmgrm4xurl4b3zmllikl4drp4r7vv4ra7gpsey4iivgzaxi6arqs2ige4eaquuy3ajkwg735ioq'
    ),
    body := v_payload,
    timeout_milliseconds := 10000
  ) into v_request_id;

  return jsonb_build_object('queued', true, 'request_id', v_request_id);
end;
$$;

grant execute on function public.send_onesignal_push(text, text, text[], text, text, text) to authenticated;

drop function if exists public.fn_notify_admin_new_order() cascade;
create or replace function public.fn_notify_admin_new_order()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  v_title text := '👜 Nouvelle commande Soumi Crochet';
  v_message text;
  v_url text := 'https://soumicrochet.store/admin/#orders';
begin
  v_message := coalesce(new.customer_name, 'Cliente') || ' - ' || coalesce(new.city, '-') || ' - ' || coalesce(new.phone, '-');

  perform public.send_onesignal_push(
    v_title,
    v_message,
    null,
    v_url,
    'Voir commande',
    '7e6b1cf8-6a2f-44ad-ada2-f623c8046d81'
  );

  insert into public.notification_logs(title, message, target_segment)
  values (v_title, v_message, 'admin_all:new_order');

  return new;
end;
$$;

drop trigger if exists trg_notify_admin_new_order on public.orders;
create trigger trg_notify_admin_new_order
after insert on public.orders
for each row execute function public.fn_notify_admin_new_order();

drop function if exists public.fn_notify_admin_new_review() cascade;
create or replace function public.fn_notify_admin_new_review()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  v_title text;
  v_message text;
  v_url text := 'https://soumicrochet.store/admin/#reviews';
begin
  v_title := '⭐ Avis جديد من ' || coalesce(new.reviewer_name, 'Cliente');
  v_message := coalesce(new.city, '-') || ': ' || left(coalesce(new.review_text, ''), 140);

  perform public.send_onesignal_push(
    v_title,
    v_message,
    null,
    v_url,
    'قبول الرأي',
    '7e6b1cf8-6a2f-44ad-ada2-f623c8046d81'
  );

  insert into public.notification_logs(title, message, target_segment)
  values (v_title, v_message, 'admin_all:new_review');

  return new;
end;
$$;

drop trigger if exists trg_notify_admin_new_review on public.reviews;
create trigger trg_notify_admin_new_review
after insert on public.reviews
for each row execute function public.fn_notify_admin_new_review();
