using Microsoft.EntityFrameworkCore;
using Mutils.Core.Entities;

namespace Mutils.Infrastructure.Data;

public class MutilsDbContext : DbContext {
    public MutilsDbContext(DbContextOptions<MutilsDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Character> Characters => Set<Character>();
    public DbSet<CollectionEntry> CollectionEntries => Set<CollectionEntry>();
    public DbSet<EnableList> EnableLists => Set<EnableList>();
    public DbSet<DisableList> DisableLists => Set<DisableList>();
    public DbSet<ListPreset> ListPresets => Set<ListPreset>();
    public DbSet<StoredImage> StoredImages => Set<StoredImage>();
    public DbSet<ImageJob> ImageJobs => Set<ImageJob>();
    public DbSet<Bundle> Bundles => Set<Bundle>();
    public DbSet<Series> Series => Set<Series>();
    public DbSet<BundleCharacterEntry> BundleCharacterEntries => Set<BundleCharacterEntry>();
    public DbSet<BundleSeriesEntry> BundleSeriesEntries => Set<BundleSeriesEntry>();
    public DbSet<KakeraClaim> KakeraClaims => Set<KakeraClaim>();
    public DbSet<CalculatorConfig> CalculatorConfigs => Set<CalculatorConfig>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<WishlistEntry> WishlistEntries => Set<WishlistEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        modelBuilder.Entity<User>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.DiscordId).IsUnique();
            entity.Property(e => e.DiscordId).IsRequired();
            entity.Property(e => e.Username).IsRequired();
        });

        modelBuilder.Entity<Character>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.Rank);
            entity.HasIndex(e => e.Kakera);
            entity.HasIndex(e => e.StoredImageId);
            entity.Property(e => e.Name).IsRequired();
            entity.HasOne(e => e.StoredImage)
                .WithMany(s => s.Characters)
                .HasForeignKey(e => e.StoredImageId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Series)
                .WithMany(s => s.Characters)
                .HasForeignKey(s => s.SeriesId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Series>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name);
        });

        modelBuilder.Entity<Series>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name);
        });

        modelBuilder.Entity<StoredImage>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.BucketName, e.ObjectKey }).IsUnique();
            entity.HasIndex(e => e.OriginalUrl);
            entity.Property(e => e.ObjectKey).IsRequired();
            entity.Property(e => e.BucketName).IsRequired();
            entity.Property(e => e.ContentType).IsRequired();
        });

        modelBuilder.Entity<CollectionEntry>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasAlternateKey(e => new { e.UserId, e.CharacterId });
            entity.HasOne(e => e.User)
                .WithMany(u => u.Collection)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Character)
                .WithMany(c => c.CollectionEntries)
                .HasForeignKey(e => e.CharacterId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BundleCharacterEntry>(entity => {
            entity.HasKey(e => new { e.BundleId, e.CharacterId });
            entity.HasOne(e => e.Bundle)
                .WithMany(b => b.CharacterEntries)
                .HasForeignKey(b => b.CharacterId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Character)
                .WithMany(c => c.BundleEntries)
                .HasForeignKey(b => b.CharacterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BundleSeriesEntry>(entity => {
            entity.HasKey(e => new { e.BundleId, e.SeriesId });
            entity.HasOne(e => e.Bundle)
                .WithMany(b => b.SeriesEntries)
                .HasForeignKey(b => b.SeriesId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Series)
                .WithMany(c => c.BundleEntries)
                .HasForeignKey(b => b.SeriesId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EnableList>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasOne(e => e.User)
                .WithMany(u => u.EnableLists)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DisableList>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasOne(e => e.User)
                .WithMany(u => u.DisableLists)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ListPreset>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Type);
            entity.HasOne(e => e.User)
                .WithMany(u => u.ListPresets)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ImageJob>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.CharacterId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => new { e.CharacterId, e.OriginalUrl });
            entity.Property(e => e.OriginalUrl).IsRequired();
            entity.HasOne(e => e.Character)
                .WithMany()
                .HasForeignKey(e => e.CharacterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<KakeraClaim>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CharacterId);
            entity.HasIndex(e => e.ClaimedAt);
            entity.HasIndex(e => e.Type);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Character)
                .WithMany()
                .HasForeignKey(e => e.CharacterId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<CalculatorConfig>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserProfile>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WishlistEntry>(entity => {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CharacterId);
            entity.HasIndex(e => e.IsStarwish);
            entity.HasAlternateKey(e => new { e.UserId, e.CharacterId });
            entity.HasOne(e => e.User)
                .WithMany(u => u.WishlistEntries)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Character)
                .WithMany(c => c.WishlistEntries)
                .HasForeignKey(e => e.CharacterId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override int SaveChanges() {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps() {
        var entries = ChangeTracker.Entries<BaseEntity>();
        foreach (var entry in entries) {
            if (entry.State == EntityState.Added) {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            } else if (entry.State == EntityState.Modified) {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}
