using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Reviews;

namespace RunAm.Application.Notifications.Commands;

// ── Get Notification Preferences ───────────────

public record GetNotificationPreferencesQuery(Guid UserId) : IRequest<NotificationPreferenceDto>;

public class GetNotificationPreferencesQueryHandler : IRequestHandler<GetNotificationPreferencesQuery, NotificationPreferenceDto>
{
    private readonly INotificationPreferenceRepository _prefRepo;

    public GetNotificationPreferencesQueryHandler(INotificationPreferenceRepository prefRepo) => _prefRepo = prefRepo;

    public async Task<NotificationPreferenceDto> Handle(GetNotificationPreferencesQuery query, CancellationToken ct)
    {
        var pref = await _prefRepo.GetOrCreateAsync(query.UserId, ct);
        return new NotificationPreferenceDto(
            pref.PushEnabled, pref.EmailEnabled, pref.SmsEnabled,
            pref.ErrandUpdates, pref.ChatMessages, pref.PaymentAlerts,
            pref.Promotions, pref.SystemAlerts, pref.FcmToken
        );
    }
}

// ── Update Notification Preferences ────────────

public record UpdateNotificationPreferencesCommand(
    Guid UserId,
    UpdateNotificationPreferenceRequest Request
) : IRequest<NotificationPreferenceDto>;

public class UpdateNotificationPreferencesCommandHandler : IRequestHandler<UpdateNotificationPreferencesCommand, NotificationPreferenceDto>
{
    private readonly INotificationPreferenceRepository _prefRepo;
    private readonly IUnitOfWork _uow;

    public UpdateNotificationPreferencesCommandHandler(INotificationPreferenceRepository prefRepo, IUnitOfWork uow)
    {
        _prefRepo = prefRepo;
        _uow = uow;
    }

    public async Task<NotificationPreferenceDto> Handle(UpdateNotificationPreferencesCommand command, CancellationToken ct)
    {
        var pref = await _prefRepo.GetOrCreateAsync(command.UserId, ct);
        var req = command.Request;

        if (req.PushEnabled.HasValue) pref.PushEnabled = req.PushEnabled.Value;
        if (req.EmailEnabled.HasValue) pref.EmailEnabled = req.EmailEnabled.Value;
        if (req.SmsEnabled.HasValue) pref.SmsEnabled = req.SmsEnabled.Value;
        if (req.ErrandUpdates.HasValue) pref.ErrandUpdates = req.ErrandUpdates.Value;
        if (req.ChatMessages.HasValue) pref.ChatMessages = req.ChatMessages.Value;
        if (req.PaymentAlerts.HasValue) pref.PaymentAlerts = req.PaymentAlerts.Value;
        if (req.Promotions.HasValue) pref.Promotions = req.Promotions.Value;
        if (req.SystemAlerts.HasValue) pref.SystemAlerts = req.SystemAlerts.Value;
        if (req.FcmToken != null) pref.FcmToken = req.FcmToken;

        await _prefRepo.UpdateAsync(pref, ct);
        await _uow.SaveChangesAsync(ct);

        return new NotificationPreferenceDto(
            pref.PushEnabled, pref.EmailEnabled, pref.SmsEnabled,
            pref.ErrandUpdates, pref.ChatMessages, pref.PaymentAlerts,
            pref.Promotions, pref.SystemAlerts, pref.FcmToken
        );
    }
}

// ── Broadcast Notification (Admin) ─────────────

public record BroadcastNotificationCommand(BroadcastNotificationRequest Request) : IRequest;

public class BroadcastNotificationCommandHandler : IRequestHandler<BroadcastNotificationCommand>
{
    private readonly INotificationDispatcher _dispatcher;
    private readonly INotificationTemplateRepository _templateRepo;

    public BroadcastNotificationCommandHandler(INotificationDispatcher dispatcher, INotificationTemplateRepository templateRepo)
    {
        _dispatcher = dispatcher;
        _templateRepo = templateRepo;
    }

    public async Task Handle(BroadcastNotificationCommand command, CancellationToken ct)
    {
        var req = command.Request;
        var title = req.Title;
        var body = req.Body;

        // If template specified, use it
        if (req.TemplateId.HasValue)
        {
            var template = await _templateRepo.GetByIdAsync(req.TemplateId.Value, ct);
            if (template != null)
            {
                title = template.Subject;
                body = template.Body;
            }
        }

        await _dispatcher.BroadcastAsync(req.Segment ?? "all", title, body, req.SendEmail, req.SendSms, req.SendPush, ct);
    }
}

// ── CRUD Notification Templates (Admin) ────────

public record CreateNotificationTemplateCommand(CreateNotificationTemplateRequest Request) : IRequest<NotificationTemplateDto>;

public class CreateNotificationTemplateCommandHandler : IRequestHandler<CreateNotificationTemplateCommand, NotificationTemplateDto>
{
    private readonly INotificationTemplateRepository _templateRepo;
    private readonly IUnitOfWork _uow;

    public CreateNotificationTemplateCommandHandler(INotificationTemplateRepository templateRepo, IUnitOfWork uow)
    {
        _templateRepo = templateRepo;
        _uow = uow;
    }

    public async Task<NotificationTemplateDto> Handle(CreateNotificationTemplateCommand command, CancellationToken ct)
    {
        var req = command.Request;
        var template = new NotificationTemplate
        {
            Name = req.Name,
            Subject = req.Subject,
            Body = req.Body,
            HtmlBody = req.HtmlBody,
            Channel = req.Channel
        };

        await _templateRepo.AddAsync(template, ct);
        await _uow.SaveChangesAsync(ct);

        return new NotificationTemplateDto(
            template.Id, template.Name, template.Subject, template.Body,
            template.HtmlBody, template.Channel, template.IsActive, template.CreatedAt
        );
    }
}

public record GetNotificationTemplatesQuery(int Page = 1, int PageSize = 20) : IRequest<IReadOnlyList<NotificationTemplateDto>>;

public class GetNotificationTemplatesQueryHandler : IRequestHandler<GetNotificationTemplatesQuery, IReadOnlyList<NotificationTemplateDto>>
{
    private readonly INotificationTemplateRepository _templateRepo;

    public GetNotificationTemplatesQueryHandler(INotificationTemplateRepository templateRepo) => _templateRepo = templateRepo;

    public async Task<IReadOnlyList<NotificationTemplateDto>> Handle(GetNotificationTemplatesQuery query, CancellationToken ct)
    {
        var templates = await _templateRepo.GetAllAsync(query.Page, query.PageSize, ct);
        return templates.Select(t => new NotificationTemplateDto(
            t.Id, t.Name, t.Subject, t.Body, t.HtmlBody, t.Channel, t.IsActive, t.CreatedAt
        )).ToList();
    }
}

public record DeleteNotificationTemplateCommand(Guid Id) : IRequest;

public class DeleteNotificationTemplateCommandHandler : IRequestHandler<DeleteNotificationTemplateCommand>
{
    private readonly INotificationTemplateRepository _templateRepo;
    private readonly IUnitOfWork _uow;

    public DeleteNotificationTemplateCommandHandler(INotificationTemplateRepository templateRepo, IUnitOfWork uow)
    {
        _templateRepo = templateRepo;
        _uow = uow;
    }

    public async Task Handle(DeleteNotificationTemplateCommand command, CancellationToken ct)
    {
        await _templateRepo.DeleteAsync(command.Id, ct);
        await _uow.SaveChangesAsync(ct);
    }
}
