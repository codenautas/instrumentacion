set search_path = "instrumentacion", public;

alter table "instapp" add column "policy" text;
alter table "instapp" add column "success_redirect" text;

alter table "instapp" add constraint "policy<>''" check ("policy"<>'');
alter table "instapp" add constraint "success_redirect<>''" check ("success_redirect"<>'');
