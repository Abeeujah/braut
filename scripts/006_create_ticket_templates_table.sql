-- Create ticket templates table for custom ticket designs
create table if not exists public.ticket_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  template_html text not null,
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on ticket_templates table
alter table public.ticket_templates enable row level security;

-- Create policies for ticket_templates table
create policy "Anyone can view templates"
  on public.ticket_templates for select
  using (true);

create policy "Anyone can insert templates"
  on public.ticket_templates for insert
  with check (true);

create policy "Anyone can update templates"
  on public.ticket_templates for update
  using (true);

-- Insert default template
insert into public.ticket_templates (name, description, template_html, is_default) values (
  'Classic Design',
  'Default colorful ticket with house colors',
  '<div class="ticket-container">
    <div class="ticket-header" style="background-color: {{houseColor}};">
      <div class="ticket-icon">{{houseIcon}}</div>
      <h2 class="ticket-house">House {{house}}</h2>
      <p class="ticket-event">De Adonai Funfair 2024</p>
    </div>
    <div class="ticket-content">
      <div class="ticket-photo" style="background-image: url({{photoUrl}})"></div>
      <div class="ticket-info">
        <div class="info-item">
          <span class="info-label">NAME</span>
          <span class="info-value">{{name}}</span>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">AGE</span>
            <span class="info-value">{{age}}</span>
          </div>
          <div class="info-item">
            <span class="info-label">CLASS</span>
            <span class="info-value">{{class}}</span>
          </div>
          <div class="info-item">
            <span class="info-label">GENDER</span>
            <span class="info-value">{{gender}}</span>
          </div>
        </div>
      </div>
      <div class="ticket-qr">{{qrCode}}</div>
      <div class="ticket-number">
        <span class="number-label">TICKET #</span>
        <span class="number-value">{{ticketNumber}}</span>
      </div>
    </div>
    <div class="ticket-footer">Present this ticket for gift distribution</div>
  </div>',
  true
) on conflict do nothing;
