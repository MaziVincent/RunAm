FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/RunAm.Api/RunAm.Api.csproj", "src/RunAm.Api/"]
COPY ["src/RunAm.Application/RunAm.Application.csproj", "src/RunAm.Application/"]
COPY ["src/RunAm.Domain/RunAm.Domain.csproj", "src/RunAm.Domain/"]
COPY ["src/RunAm.Infrastructure/RunAm.Infrastructure.csproj", "src/RunAm.Infrastructure/"]
COPY ["src/RunAm.Shared/RunAm.Shared.csproj", "src/RunAm.Shared/"]
RUN dotnet restore "src/RunAm.Api/RunAm.Api.csproj"
COPY . .
WORKDIR "/src/src/RunAm.Api"
RUN dotnet build "RunAm.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RunAm.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "RunAm.Api.dll"]
