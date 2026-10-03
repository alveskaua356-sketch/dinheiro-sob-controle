begin;
create table public.settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '' check (char_length(name)<=100),
 language text not null default 'pt-BR' check(language in ('pt-BR','en-US')),
 currency text not null default 'BRL' check(currency='BRL'),
 theme text not null default 'light' check(theme in ('light','dark')),
 notifications boolean not null default true
);
create table public.categories (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(trim(name)) between 1 and 60),
 color text not null default '#23845b' check(color ~ '^#[0-9a-fA-F]{6}$'),
 builtin_key text check(builtin_key in ('essenciais','dividas','lazer','futuro')),
 unique(user_id,id)
);
create unique index categories_name_unique on public.categories(user_id,lower(trim(name)));
create table public.transactions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 description text not null check(char_length(trim(description)) between 1 and 200),
 amount_cents bigint not null check(amount_cents between 1 and 1000000000000),
 type text not null check(type in ('income','expense')),
 category_id uuid not null,
 date date not null, created_at timestamptz not null default now(),
 foreign key(user_id,category_id) references public.categories(user_id,id) on delete restrict
);
create table public.goals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(trim(title)) between 1 and 120),
 target_cents bigint not null check(target_cents between 1 and 1000000000000),
 current_cents bigint not null default 0 check(current_cents between 0 and 1000000000000),
 deadline date
);
create table public.budgets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 category_id uuid not null, month text not null check(month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
 limit_cents bigint not null check(limit_cents between 1 and 1000000000000),
 alert_threshold integer not null default 80 check(alert_threshold between 1 and 100),
 foreign key(user_id,category_id) references public.categories(user_id,id) on delete restrict,
 unique(user_id,category_id,month)
);
create index transactions_user_date on public.transactions(user_id,date);
create index goals_user on public.goals(user_id);
create index budgets_user_month on public.budgets(user_id,month);
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.budgets enable row level security;
revoke all on public.settings,public.categories,public.transactions,public.goals,public.budgets from anon,authenticated;
grant select,update on public.settings to authenticated;
grant select,insert,update,delete on public.categories,public.transactions,public.goals,public.budgets to authenticated;
create policy settings_read on public.settings for select to authenticated using(user_id=(select auth.uid()));
create policy settings_update on public.settings for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
do $$
declare tab text;
begin
 foreach tab in array array['categories','transactions','goals','budgets'] loop
 execute format('create policy own_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',tab);
 execute format('create policy own_insert on public.%I for insert to authenticated with check(user_id=(select auth.uid()))',tab);
 execute format('create policy own_update on public.%I for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()))',tab);
 execute format('create policy own_delete on public.%I for delete to authenticated using(user_id=(select auth.uid()))',tab);
 end loop;
end $$;
create function public.initialize_customer() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.settings(user_id,name) values(new.id,left(coalesce(new.raw_user_meta_data->>'name',''),100));
 insert into public.categories(user_id,name,color,builtin_key) values
 (new.id,'Essenciais','#164e3b','essenciais'),(new.id,'Dívidas e Parcelas','#e4a33b','dividas'),
 (new.id,'Lazer e Compras','#3d9b74','lazer'),(new.id,'Futuro','#588bbd','futuro');
 return new;
end $$;
revoke all on function public.initialize_customer() from public,anon,authenticated;
create trigger initialize_customer after insert on auth.users for each row execute function public.initialize_customer();
-- Initialize accounts that predate installation; no financial sample records are inserted.
insert into public.settings(user_id,name) select id,left(coalesce(raw_user_meta_data->>'name',''),100) from auth.users on conflict do nothing;
insert into public.categories(user_id,name,color,builtin_key)
select u.id,c.name,c.color,c.key from auth.users u cross join (values
 ('Essenciais','#164e3b','essenciais'),('Dívidas e Parcelas','#e4a33b','dividas'),
 ('Lazer e Compras','#3d9b74','lazer'),('Futuro','#588bbd','futuro')) c(name,color,key)
where not exists(select 1 from public.categories x where x.user_id=u.id and x.builtin_key=c.key);
create function public.add_goal_progress(goal_id uuid, contribution_cents bigint)
returns public.goals language plpgsql security invoker set search_path='' as $$
declare updated public.goals;
begin
 if contribution_cents <= 0 or contribution_cents > 1000000000000 then
  raise exception 'invalid contribution' using errcode='22003';
 end if;
 update public.goals set current_cents=current_cents+contribution_cents
 where id=goal_id and user_id=(select auth.uid()) returning * into updated;
 if updated.id is null then raise exception 'goal unavailable' using errcode='42501'; end if;
 return updated;
end $$;
revoke all on function public.add_goal_progress(uuid,bigint) from public,anon,authenticated;
grant execute on function public.add_goal_progress(uuid,bigint) to authenticated;
commit;
